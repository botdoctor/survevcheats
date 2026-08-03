
import { assertAllowedUrl } from './urlPolicy.js';

console.log('Script injecting...');

unsafeWindow.__SURVEVGPT_PATCH_STATUS__ = [];
unsafeWindow.__SURVEVGPT_INJECTION_STATUS__ = { stage: 'discovering' };

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

async function createModuleScript() {
    if (typeof GM !== 'undefined' && typeof GM.addElement === 'function') {
        return GM.addElement(document.head, 'script', { type: 'module' });
    }
    if (typeof GM_addElement === 'function') {
        return GM_addElement(document.head, 'script', { type: 'module' });
    }
    const script = document.createElement('script');
    script.type = 'module';
    document.head.append(script);
    return script;
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
        unsafeWindow.__SURVEVGPT_INJECTION_STATUS__ = { stage: 'classification-failed' };
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
    unsafeWindow.__SURVEVGPT_INJECTION_STATUS__ = {
        stage: 'bundles-classified',
        app: originalAppURL,
        shared: originalSharedURL,
        vendor: originalVendorURL,
    };

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
                from: /(\w+)=\{bullet_mp5:\{type:([`'"])bullet\2,damage:/,
                to: '$1=window.bullets={bullet_mp5:{type:$2bullet$2,damage:'
            },
            {
                name: 'explosions',
                from: /(\w+)=\{explosion_frag:\{type:([`'"])explosion\2,damage:/,
                to: '$1=window.explosions={explosion_frag:{type:$2explosion$2,damage:'
            },
            {
                name: 'guns',
                from: /(\w+)=\{mp5:\{name:([`'"])MP5\2,type:([`'"])gun\3,/,
                to: '$1=window.guns={mp5:{name:$2MP5$2,type:$3gun$3,'
            },
            {
                name: 'throwable',
                from: /(\w+)=\{frag:\{name:([`'"])Frag Grenade\2,type:([`'"])throwable\3,/,
                to: '$1=window.throwable={frag:{name:$2Frag Grenade$2,type:$3throwable$3,'
            },
            {
                name: 'objects',
                from: /(\w+)=new (\w+)\([`'"]Game[`'"],(\w+),10\),(\w+)=new \2\([`'"]Map[`'"],(\w+),12\);function (\w+)\(/,
                to: '$1=new $2(`Game`,$3,10),$4=new $2(`Map`,$5,12);window.gameObjectDefs=$1._defs;window.objects=$4._defs;function $6('
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
                name: 'Map colorizing',
                from: /(\w+)\.sort\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>\s*\2\.zIdx\s*-\s*\3\.zIdx\s*\);/,
                to: `$1.sort(($2, $3) => $2.zIdx - $3.zIdx);\nwindow.mapColorizing($1);`
            },
            // {
            //     name: 'pieTimerClass',
            //     from: '=24;',
            //     to: `=24;window.pieTimerClass = `
            // },
            {
                name: 'Class definition with methods',
                from: /(\w+)=24,(\w+)=class\{container=new (\w+);/,
                to: '$1=24,$2=window.pieTimerClass=class{container=new $3;'
            },
            {
                name: 'isMobile (basicDataInfo)',
                from: /(\w+)\.isMobile\s*=\s*(\w+)\.mobile\s*\|\|\s*window\.mobile\s*,/,
                to: `$1.isMobile = $2.mobile || window.mobile,window.basicDataInfo = $1,`
            },
            {
                name: 'Game',
                from: /this\.game=new (\w+)\(this\.pixi,this\.audioManager,this\.localization,this\.config,this\.input,this\.inputBinds,this\.inputBindUi,this\.ambience,this\.resourceManager,(\w+),(\w+)\)/,
                to: 'this.game=window.game=window.installSurvevGptCompat(new $1(this.pixi,this.audioManager,this.localization,this.config,this.input,this.inputBinds,this.inputBindUi,this.ambience,this.resourceManager,$2,$3))'
            },
            {
                name: 'Override gameControls',
                from: /this\.(\w+)\((\w+)\.Input,(\w+),128\),this\.(\w+)=1,this\.(\w+)=\3/,
                to: 'this._newGameControls=window.initGameControls($3),this.$1($2.Input,this._newGameControls,128),this.$4=1,this.$5=this._newGameControls'
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

    const appScript = await createModuleScript();
    appScript.onload = () => {
        unsafeWindow.__SURVEVGPT_INJECTION_STATUS__ = { stage: 'module-loaded' };
        console.log('Im injected appjs', appScript);

        // Восстанавливаем оригинальный addEventListener
        document.addEventListener = originalAddEventListener;

        // Искусственно вызываем все сохраненные обработчики
        isolatedHandlers.forEach((handler) => handler.call(document));
    }
    appScript.onerror = (event) => {
        document.addEventListener = originalAddEventListener;
        unsafeWindow.__SURVEVGPT_INJECTION_STATUS__ = {
            stage: 'module-load-failed',
            src: modifiedAppURL,
        };
        console.error('[SurvevGPT] Rewritten application module failed to load.', event);
    };
    unsafeWindow.__SURVEVGPT_INJECTION_STATUS__ = { stage: 'loading-module' };
    appScript.src = modifiedAppURL;
})();



console.log('Script injected')
