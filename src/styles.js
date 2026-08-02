const styles = document.createElement('style');
styles.innerHTML = `
#survevgpt-menu {
    --sg-accent: #4ee7a8;
    position: fixed;
    top: 50%;
    left: 18px;
    width: min(390px, calc(100vw - 36px));
    max-height: min(760px, calc(100vh - 36px));
    display: none;
    flex-direction: column;
    overflow: hidden;
    color: #eef7f3;
    background: rgba(10, 16, 19, .97);
    border: 1px solid rgba(78, 231, 168, .32);
    border-radius: 14px;
    box-shadow: 0 18px 65px rgba(0, 0, 0, .5);
    transform: translateY(-50%);
    z-index: 2147483647;
    font: 14px/1.35 system-ui, sans-serif;
    user-select: none;
}
#survevgpt-menu.is-open { display: flex; }
#survevgpt-menu header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 16px;
    border-bottom: 1px solid rgba(255,255,255,.08);
}
#survevgpt-menu header strong { display: block; font-size: 18px; letter-spacing: .02em; }
#survevgpt-menu header span { color: var(--sg-accent); font-size: 10px; letter-spacing: .14em; }
#survevgpt-menu header button { color: #9eaaa5; background: transparent; border: 0; font-size: 26px; cursor: pointer; }
.survevgpt-menu-body { overflow: auto; padding: 8px 16px 14px; }
#survevgpt-menu section { padding: 8px 0 5px; }
#survevgpt-menu h3 { margin: 5px 0 7px; color: #8d9b96; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
.survevgpt-toggle { min-height: 34px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; }
.survevgpt-toggle > span { display: flex; align-items: center; gap: 7px; }
.survevgpt-toggle input { position: absolute; opacity: 0; pointer-events: none; }
.survevgpt-toggle i { width: 34px; height: 18px; position: relative; flex: 0 0 auto; border-radius: 99px; background: #344039; transition: .15s; }
.survevgpt-toggle i::after { content: ''; position: absolute; width: 14px; height: 14px; top: 2px; left: 2px; border-radius: 50%; background: #9ca7a2; transition: .15s; }
.survevgpt-toggle input:checked + i { background: rgba(78,231,168,.28); }
.survevgpt-toggle input:checked + i::after { left: 18px; background: var(--sg-accent); }
#survevgpt-menu kbd { padding: 1px 5px; color: #9eaaa5; background: #202a26; border: 1px solid #35413c; border-radius: 4px; font: 10px monospace; }
#survevgpt-menu footer { padding: 11px 16px; color: #7f8c87; border-top: 1px solid rgba(255,255,255,.08); font-size: 11px; }
.survevgpt-reproductions p { margin: 0 0 8px; color: #85938d; font-size: 11px; }
.survevgpt-reproductions button { width: 100%; margin: 3px 0; padding: 8px 10px; color: #dce9e4; background: #202b27; border: 1px solid #36443e; border-radius: 6px; cursor: pointer; text-align: left; }
.survevgpt-reproductions button:hover { border-color: var(--sg-accent); }
.survevgpt-reproductions button.is-destructive { color: #ffb5b5; border-color: rgba(255,90,90,.45); }
.krity-overlay{
    position: absolute;
    top: 128px;
    left: 0px;
    width: 100%;
    pointer-events: None;
    color: #fff;
    font-family: monospace;
    text-shadow: 0 0 5px rgba(0, 0, 0, .5);
    z-index: 1;
}

.krity-title{
    text-align: center;
    margin-top: 10px;
    margin-bottom: 10px;
    font-size: 25px;
    text-shadow: 0 0 10px rgba(0, 0, 0, .9);
    color: #fff;
    font-family: monospace;
    pointer-events: None;
}

.krity-control{
    text-align: center;
    margin-top: 3px;
    margin-bottom: 3px;
    font-size: 18px;
}

.aimbotDot{
    position: absolute;
    top: 0;
    left: 0;
    width: 10px;
    height: 10px;
    background-color: red;
    transform: translateX(-50%) translateY(-50%);
    display: none;
}

#news-current ul{
    margin-left: 20px;
    padding-left: 6px;
}
`;

document.head.append(styles);
