/* Best-effort composer adapter. No private API, URL payload, or automatic submit. */
(async function () {
  const providerId = LH.providerForUrl(location.href);
  if (!providerId) return;
  const provider = LH.getProvider(providerId);
  const name = provider.label;
  const result = await chrome.runtime.sendMessage({ type: 'LH_PENDING' }).catch(() => null);
  if (!result?.transfer || (result.transfer.provider ?? 'chatgpt') !== providerId) return;
  const text = result.transfer.text;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;width:min(360px,calc(100vw - 32px))';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    :host{color-scheme:light}*{box-sizing:border-box}.card{font:13px/1.5 system-ui;background:#fafbf7;color:#18322e;border:1px solid #cad8cd;border-radius:16px;padding:18px;box-shadow:0 12px 40px #102b2833}strong{font-size:15px}p{margin:8px 0 12px}.actions{display:flex;gap:8px;flex-wrap:wrap}button{font:600 12px system-ui;border:1px solid #cbd8cd;border-radius:8px;padding:8px 10px;background:white;color:#214d41;cursor:pointer}button:focus-visible{outline:3px solid #6d967d}button:first-child{background:#214d41;color:white}textarea{width:100%;height:120px;margin-top:10px}[hidden]{display:none}
    </style><section class="card" aria-label="LectureHero handoff"><strong>LectureHero → your ${name}</strong><p role="status" aria-live="polite">Waiting for ${name}. Sign in if needed. Your draft is ready to copy.</p><div class="actions"><button id="insert">Insert draft</button><button id="copy">Copy message</button><button id="dismiss">Dismiss</button></div><textarea hidden readonly aria-label="LectureHero message for manual copying"></textarea></section>`;
  document.body.append(host);
  const status = root.querySelector('p');
  let finished = false;
  let timer;
  const stop = () => { finished = true; clearInterval(timer); };
  const done = () => chrome.runtime.sendMessage({ type: 'LH_DONE' }).catch(() => {});
  const editorText = editor => editor instanceof HTMLTextAreaElement ? editor.value : editor.innerText;
  function insert(manual = false) {
    if (finished && !manual) return;
    const editors = Array.from(document.querySelectorAll(provider.editor)).filter(element =>
      element.getClientRects().length && !element.disabled && !element.readOnly && element.getAttribute('aria-disabled') !== 'true');
    // Avoid guessing if the site presents more than one visible editor.
    const editor = editors.length === 1 ? editors[0] : null;
    if (!editor || !editor.getClientRects().length || editor.disabled) {
      if (manual) status.textContent = `${name}’s message box is not ready or could not be identified. Sign in, or copy the message and paste it yourself.`;
      return;
    }
    if (editorText(editor).trim()) {
      stop(); status.textContent = 'Your existing draft is untouched. Clear the message box and choose Insert draft, or copy this message.'; return;
    }
    editor.focus();
    if (editor instanceof HTMLTextAreaElement) {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(editor, text);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // insertText goes through the editor's input pipeline and preserves plain text.
      const selection = window.getSelection(); const range = document.createRange();
      range.selectNodeContents(editor); selection.removeAllRanges(); selection.addRange(range);
      document.execCommand('insertText', false, text);
    }
    stop();
    // Rich-text editors represent paragraph breaks with different whitespace.
    const normalize = value => value.replace(/\s+/g, ' ').trim();
    if (normalize(editorText(editor)) === normalize(text)) {
      status.textContent = `Draft inserted. Review your transcript and press Send in ${name}.`;
      root.querySelector('#insert').hidden = true; done();
    } else {
      status.textContent = 'Automatic insertion could not be verified. Copy the complete message below and replace the draft manually.';
    }
  }
  const tryInsert = manual => {
    try { insert(manual); } catch { stop(); status.textContent = 'Could not insert automatically. Copy the message and paste it into your chat.'; }
  };
  root.querySelector('#insert').onclick = () => tryInsert(true);
  root.querySelector('#copy').onclick = async () => {
    stop();
    try { await navigator.clipboard.writeText(text); status.textContent = `Copied. Paste into ${name}, review, and press Send.`; }
    catch {
      const area = root.querySelector('textarea'); area.hidden = false; area.value = text; area.focus(); area.select();
      status.textContent = 'Use Ctrl+C or ⌘C to copy the selected message, then paste into your chat.';
    }
  };
  root.querySelector('#dismiss').onclick = () => { stop(); done(); host.remove(); };
  // Bounded retries; manual insertion remains available after login or slow loading.
  let attempts = 0;
  timer = setInterval(() => {
    tryInsert(false);
    if (++attempts >= 60) { stop(); if (!root.querySelector('#insert').hidden) status.textContent = 'Choose Insert draft once your chat is ready, or copy and paste the message.'; }
  }, 1000);
})();
