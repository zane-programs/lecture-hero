(function () {
  if (document.getElementById('lecturehero-byo-chat')) return;
  const host = document.createElement('div'); host.id = 'lecturehero-byo-chat';
  host.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483646;color-scheme:light';
  const shadow = host.attachShadow({ mode: 'open' });
  const launcher = document.createElement('button');
  launcher.textContent = '✦ LectureHero'; launcher.setAttribute('aria-expanded', 'false');
  launcher.style.cssText = 'font:600 14px system-ui;color:#fff;background:#214d41;border:1px solid #8aa492;border-radius:100px;padding:13px 20px;cursor:pointer;box-shadow:0 6px 24px #102b2833';
  const panel = document.createElement('div'); panel.hidden = true;
  panel.style.cssText = 'width:min(420px,calc(100vw - 40px));max-height:calc(100vh - 40px);overflow:auto;border-radius:22px';
  const close = () => { panel.hidden = true; launcher.hidden = false; launcher.setAttribute('aria-expanded', 'false'); launcher.focus(); };
  shadow.append(launcher, panel); document.body.append(host);
  const ui = LH.mount(panel, { capture: () => LH.extract(document), close });
  let opened = false;
  launcher.onclick = () => { panel.hidden = false; launcher.hidden = true; launcher.setAttribute('aria-expanded', 'true'); if (!opened) { ui.refresh(); opened = true; } ui.focus(); };
  shadow.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } });
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type === 'LH_CAPTURE') respond(LH.extract(document));
  });
})();
