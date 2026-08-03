
import { assertAllowedUrl } from './urlPolicy.js';

console.log('Script injecting...');

unsafeWindow.__SURVEVGPT_PATCH_STATUS__ = [];

function applyPatches(source, patches, group) {
    for (const patch of patches) {
        const matched = typeof patch.from === 'string'
            ? source.includes(patch.from)
            : patch.from.test(source);
        unsafeWindow.__SURVEVGPT_PATCH_STATUS__.push({ group, name: patch.name, matched });
        if (!matched) {
            console.error(`[SurvevGPT] Missing ${group} patch: ${patch.name}`);
            continue;
        }
        source = source.replace(patch.from, patch.to);
    }
    return source;
}

function requestText(url) {
    assertAllowedUrl(url, 'inspect game bundle');
    const extractText = (response) => {
        if (response.status && (response.status < 200 || response.status >= 300)) {
            throw new Error(`HTTP ${response.status} while inspecting ${url}`);
        }
        return response.responseText;
    };
    if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function') {
        return GM.xmlHttpRequest({ url }).then(extractText);
    }
    if (typeof GM_xmlhttpRequest === 'function') {
        return new Promise((resolve, reject) => GM_xmlhttpRequest({
            url,
            onload: (response) => {
                try {
                    resolve(extractText(response));
                } catch (error) {
                    reject(error);
                }
            },
            onerror: reject,
            ontimeout: reject,
        }));
    }
    throw new Error('[SurvevGPT] This userscript manager does not provide GM_xmlhttpRequest.');
}


(async () => {
    const links = [
        ...Array.from(document.querySelectorAll('link[rel="modulepreload"][href]')),
        ...Array.from(document.querySelectorAll('script[type="module"][src]'))
    ];

    const candidateUrls = [...new Set(links
        .map((link) => link.src || link.href)
        .filter((url) => {
            try {
                return new URL(url, location.href).pathname.endsWith('.js');
            } catch {
                return false;
            }
        }))];
    const results = await Promise.allSettled(candidateUrls.map(async (url) => {
        const source = await requestText(url);
        const imports = [...source.matchAll(/from\s*["']([^"']+)["']/g)].map((match) => match[1]);
        return { url, source, imports };
    }));
    const assets = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
    const failures = results
        .map((result, index) => ({ result, url: candidateUrls[index] }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ result, url }) => ({ url, error: String(result.reason) }));

    if (failures.length) {
        console.warn('[SurvevGPT] Some candidate bundles could not be inspected.', failures);
    }

    const sharedAsset = assets.find((asset) => asset.source.includes('explosion_frag'));
    const appAsset = assets.find((asset) =>
        asset !== sharedAsset
        && asset.imports.length >= 2
        && (asset.source.includes('sendMessage') || asset.source.includes('WebSocket'))
    ) ?? assets.filter((asset) => asset !== sharedAsset).sort((a, b) => b.source.length - a.source.length)[0];
    const importedNames = new Set([
        ...(appAsset?.imports ?? []),
        ...(sharedAsset?.imports ?? []),
    ].map((value) => value.split('/').pop()));
    const vendorAsset = assets.find((asset) =>
        asset !== appAsset
        && asset !== sharedAsset
        && importedNames.has(asset.url.split('/').pop())
    );

    if (!appAsset || !sharedAsset || !vendorAsset) {
        console.error('[SurvevGPT] Unable to classify game bundles.', assets.map((asset) => ({
            url: asset.url,
            size: asset.source.length,
            imports: asset.imports,
            definitions: asset.source.includes('explosion_frag'),
        })));
        return;
    }

    const originalAppURL = appAsset.url;
    const originalSharedURL = sharedAsset.url;
    const originalVendorURL = vendorAsset.url;

    const modifiedVendorURL = URL.createObjectURL(new Blob([vendorAsset.source], {
        type: 'application/javascript',
    }));

    let modifiedSharedURL = null;
    let modifiedAppURL = null;
    if (originalSharedURL) {
        let scriptContent = sharedAsset.source;
        for (const specifier of sharedAsset.imports) {
            if (specifier.split('/').pop() === originalVendorURL.split('/').pop()) {
                scriptContent = scriptContent.replaceAll(specifier, modifiedVendorURL);
            }
        }
        // console.log(scriptContent);

        const sharedScriptPatches = [
            {
                name: 'bullets',
                from: /function\s+(\w+)\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*\{\s*return\s+(\w+)\((\w+),\s*(\w+),\s*(\w+)\)\s*\}\s*const\s+(\w+)\s*=\s*\{\s*(\w+)\s*:\s*\{\s*type\s*:\s*"(.*?)"\s*,\s*damage\s*:\s*(\d+)\s*,/,
                to: `function $1($2, $3) {\n    return $4($5, $6, $7)\n}\nconst $8 = window.bullets = {\n    $9: {\n        type: "$10",\n        damage: $11,`
            },
            {
                name: 'explosions',
                from: /(\w+)=\{explosion_frag:\{type:"explosion",damage:(\d+),obstacleDamage/,
                to: `$1 = window.explosions = {explosion_frag:{type:"explosion",damage:$2,obstacleDamage`
            },
            {
                name: 'guns',
                from: /(\w+)=\{(\w+):\{name:"([^"]+)",type:"gun",quality:(\d+),fireMode:"([^"]+)",caseTiming:"([^"]+)",ammo:"([^"]+)",/,
                to: `$1 = window.guns = {$2:{name:"$3",type:"gun",quality:$4,fireMode:"$5",caseTiming:"$6",ammo:"$7",`
            },
            {
                name: 'throwable',
                from: /(\w+)=\{(\w+):\{name:"([^"]+)",type:"throwable",quality:(\d+),explosionType:"([^"]+)",/,
                to: `$1 = window.throwable = {$2:{name:"$3",type:"throwable",quality:$4,explosionType:"$5",`
            },
            {
                name: 'objects',
                from: /\s*(\w+)\s*=\s*\{\s*(\w+)\s*:\s*Ve\(\{\}\)\s*,\s*(\w+)\s*:\s*Ve\(\{\s*img\s*:\s*\{\s*tint\s*:\s*(\d+)\s*\}\s*,\s*loot\s*:\s*\[\s*n\("(\w+)",\s*(\d+),\s*(\d+)\)\s*,\s*d\("(\w+)",\s*(\d+)\)\s*,\s*d\("(\w+)",\s*(\d+)\)\s*,\s*d\("(\w+)",\s*(\d+)\)\s*\]\s*\}\)\s*,/,
                to: ` $1 = window.objects = {\n    $2: Ve({}),\n    $3: Ve({\n        img: {\n            tint: $4\n        },\n        loot: [\n            n("$5", $6, $7),\n            d("$8", $9),\n            d("$10", $11),\n            d("$12", $13)\n        ]\n    }),`
            }
        ];

        scriptContent = applyPatches(scriptContent, sharedScriptPatches, 'shared');

        const blob = new Blob([scriptContent], { type: 'application/javascript' });
        modifiedSharedURL = URL.createObjectURL(blob);
        console.log(modifiedSharedURL);
    }

    if (originalAppURL) {
        let scriptContent = appAsset.source;
        for (const specifier of appAsset.imports) {
            const basename = specifier.split('/').pop();
            if (basename === originalSharedURL.split('/').pop()) {
                scriptContent = scriptContent.replaceAll(specifier, modifiedSharedURL);
            } else if (basename === originalVendorURL.split('/').pop()) {
                scriptContent = scriptContent.replaceAll(specifier, modifiedVendorURL);
            }
        }
        // console.log(scriptContent);

        const appScriptPatches = [
            {
                name: 'servers',
                from: /var\s+(\w+)\s*=\s*\[\s*({\s*region:\s*"([^"]+)",\s*zone:\s*"([^"]+)",\s*url:\s*"([^"]+)",\s*https:\s*(!0|!1)\s*}\s*(,\s*{\s*region:\s*"([^"]+)",\s*zone:\s*"([^"]+)",\s*url:\s*"([^"]+)",\s*https:\s*(!0|!1)\s*})*)\s*\];/,
                to: `var $1 = window.servers = [$2];`
            },
            {
                name: 'Map colorizing',
                from: /(\w+)\.sort\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>\s*\2\.zIdx\s*-\s*\3\.zIdx\s*\);/,
                to: `$1.sort(($2, $3) => $2.zIdx - $3.zIdx);\nwindow.mapColorizing($1);`
            },
            {
                name: 'Position without interpolation (pos._x, pos._y)',
                from: /this\.pos\s*=\s*(\w+)\.copy\((\w+)\.netData\.pos\)/,
                to: `this.pos = $1.copy($2.netData.pos),this.pos._x = this.netData.pos.x, this.pos._y = this.netData.pos.y`
            },
            {
                name: 'Movement interpolation (Game optimization)',
                from: 'this.pos._y = this.netData.pos.y',
                to: `this.pos._y = this.netData.pos.y,(window.movementInterpolation) &&
                                                        !(
                                                            Math.abs(this.pos.x - this.posOld.x) > 18 ||
                                                            Math.abs(this.pos.y - this.posOld.y) > 18
                                                        ) &&
                                                            //movement interpolation
                                                            ((this.pos.x += (this.posOld.x - this.pos.x) * 0.5),
                                                            (this.pos.y += (this.posOld.y - this.pos.y) * 0.5))`
            },
            {
                name: 'Mouse position without server delay (Game optimization)',
                from: '-Math.atan2(this.dir.y,this.dir.x)}',
                to: `-Math.atan2(this.dir.y, this.dir.x),
                (window.localRotation) &&
    ((window.game.activeId == this.__id && !window.game.spectating) &&
        (this.bodyContainer.rotation = Math.atan2(
            window.game.input.mousePos.y - window.innerHeight / 2,
            window.game.input.mousePos.x - window.innerWidth / 2
        )),
    (window.game.activeId != this.__id) &&
        (this.bodyContainer.rotation = -Math.atan2(this.dir.y, this.dir.x)));
                }`
            },
            // {
            //     name: 'pieTimerClass',
            //     from: '=24;',
            //     to: `=24;window.pieTimerClass = `
            // },
            {
                name: 'Class definition with methods',
                from: /(\w+)\s*=\s*24;\s*class\s+(\w+)\s*\{([\s\S]*?)\}\s*function/,
                to: `$1 = 24;\nclass $2 {\n$3\n}window.pieTimerClass = $2;\nfunction`
            },
            {
                name: 'isMobile (basicDataInfo)',
                from: /(\w+)\.isMobile\s*=\s*(\w+)\.mobile\s*\|\|\s*window\.mobile\s*,/,
                to: `$1.isMobile = $2.mobile || window.mobile,window.basicDataInfo = $1,`
            },
            {
                name: 'Game',
                from: /this\.(m_)?shotBarn\s*=\s*new\s*(\w+)\s*;/,
                to: `window.game = window.installSurvevGptCompat(this),this.$1shotBarn = new $2;`
            },
            {
                name: 'Override gameControls',
                from: /this\.(m_)?sendMessage\s*\(\s*(\w+)\.(\w+)\s*,\s*(\w+)\s*,\s*(\d+)\s*\)\s*,\s*this\.(m_)?inputMsgTimeout\s*=\s*(\d+)\s*,\s*this\.(m_)?prevInputMsg\s*=\s*(\w+)\s*\)/,
                to: `this._newGameControls = window.initGameControls($4), this.$1sendMessage($2.$3, this._newGameControls, $5),\nthis.$6inputMsgTimeout = $7,\nthis.$8prevInputMsg = this._newGameControls)`
            },
        ];

        scriptContent = applyPatches(scriptContent, appScriptPatches, 'app');

        // scriptContent += `alert('ja appjs');`;

        const blob = new Blob([scriptContent], { type: 'application/javascript' });
        modifiedAppURL = URL.createObjectURL(blob);
        console.log(modifiedAppURL);

        
    // }
    }

    // Создаем временный список для хранения обработчиков
    const isolatedHandlers = [];

    // Переопределяем document.addEventListener
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = function (type, listener, options) {
        if (type === 'DOMContentLoaded') {
            isolatedHandlers.push(listener); // Сохраняем обработчики отдельно
        } else {
            originalAddEventListener.call(document, type, listener, options);
        }
    };

    const appScript = document.createElement('script');
    appScript.type = 'module';
    appScript.src = modifiedAppURL;
    appScript.onload = () => {
        console.log('Im injected appjs', appScript);

        // Восстанавливаем оригинальный addEventListener
        document.addEventListener = originalAddEventListener;

        // Искусственно вызываем все сохраненные обработчики
        isolatedHandlers.forEach((handler) => handler.call(document));
    }
    document.head.append(appScript)
})();



console.log('Script injected')
