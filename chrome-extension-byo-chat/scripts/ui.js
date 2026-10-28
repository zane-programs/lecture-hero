(function () {
  LH.mount = function (root, { capture, close, popup = false } = {}) {
    root.innerHTML = `<link rel="stylesheet" href="${chrome.runtime.getURL('styles/ui.css')}">
      <section class="shell" aria-label="LectureHero BYO Chat">
        <header class="top"><div class="brand"><span class="mark" aria-hidden="true">L</span>LectureHero <span class="badge">BYO CHAT</span>${close ? '<button class="close" aria-label="Close LectureHero">×</button>' : ''}</div>
          <h1>Your lecture.<br>Your ChatGPT.</h1><p>A little less replay. A lot more understanding.</p></header>
        <div class="body">
          <div class="field"><label for="lh-title">Lecture title</label><input id="lh-title" maxlength="1000" placeholder="Untitled lecture"></div>
          <div class="field"><label for="lh-preset">Make something useful</label><select id="lh-preset"><option value="notes">Study notes</option><option value="quiz">Practice quiz</option><option value="cards">Flashcards</option><option value="custom">Custom instructions</option></select></div>
          <div class="field"><label for="lh-prompt">Instructions for ChatGPT</label><textarea id="lh-prompt" maxlength="20000"></textarea></div>
          <div class="field"><label for="lh-transcript">Transcript</label><textarea id="lh-transcript" placeholder="Open Captions and refresh, or paste your transcript here." spellcheck="false"></textarea><div class="meta" id="lh-count">No transcript yet</div>
            <div class="row"><button id="lh-refresh">Refresh from lecture</button><button id="lh-import">Import text file</button></div><input id="lh-file" type="file" accept=".txt,.vtt,.srt,text/plain,text/vtt" hidden>
            <p class="meta">Uses Panopto’s caption list, just like the original extension. Review the captured text before continuing.</p></div>
          <details id="lh-details"><summary>Preview complete message</summary><textarea class="preview" id="lh-preview" readonly aria-label="Complete message preview"></textarea></details>
          <div class="status" role="status" aria-live="polite" id="lh-status"></div>
          <button class="primary" id="lh-send">Continue in ChatGPT ↗</button>
          <p class="meta">Opens a new chat with your draft. Review it and press Send in ChatGPT.</p>
          <div class="row" style="margin-top:12px"><button id="lh-copy">Copy message</button><button id="lh-download">Download .txt</button></div>
          <p class="privacy">Your account. No API key. No LectureHero server.</p>
          ${popup ? '<div class="recovery"><div class="row"><button id="lh-recover">Copy last handoff</button><button id="lh-clear">Clear handoffs</button></div><p class="meta">Recovery is available for 30 minutes in this browser session.</p></div>' : ''}
        </div>
      </section>`;
    const $ = id => root.querySelector(`#lh-${id}`);
    const status = (text, error = false) => { $('status').textContent = text; $('status').classList.toggle('error', error); };
    const draft = () => ({ title: $('title').value, transcript: $('transcript').value, prompt: $('prompt').value });
    const update = () => {
      const text = $('transcript').value.trim();
      $('count').textContent = text ? `${text.split(/\s+/).length.toLocaleString()} words · ${text.length.toLocaleString()} characters${text.length > 50000 ? ' · Long lecture: download and attach the file if ChatGPT rejects the message.' : ''}` : 'No transcript yet';
      try { $('preview').value = LH.buildMessage(draft()); } catch { $('preview').value = ''; }
    };
    const run = async task => { try { await task(); } catch (error) { status(error.message || 'Something went wrong. Please try again.', true); } };
    let promptEdited = false;
    $('prompt').value = LH.presets.notes.prompt;
    chrome.storage.local.get('preferences').then(({ preferences }) => {
      if (!promptEdited && preferences?.prompt) {
        $('prompt').value = preferences.prompt;
        $('preset').value = Object.hasOwn(LH.presets, preferences.preset) ? preferences.preset : 'custom';
        update();
      }
    }).catch(() => {});
    const save = () => {
      promptEdited = true;
      chrome.storage.local.set({ preferences: { prompt: $('prompt').value, preset: $('preset').value } }).catch(() => status('Could not save your prompt preference.', true));
    };
    $('preset').onchange = () => { if (LH.presets[$('preset').value]) $('prompt').value = LH.presets[$('preset').value].prompt; save(); update(); };
    $('prompt').oninput = () => { $('preset').value = 'custom'; save(); update(); };
    $('title').oninput = $('transcript').oninput = update;
    const refresh = () => run(async () => {
      const result = await capture();
      if (!result?.transcript?.trim()) throw new Error('No captions found. Open a Panopto lecture’s Captions tab and refresh, or paste/import a transcript.');
      $('title').value = result.title;
      $('transcript').value = result.transcript;
      update(); status('Transcript captured. Review it below before continuing.');
    });
    $('refresh').onclick = refresh;
    $('import').onclick = () => $('file').click();
    $('file').onchange = () => run(async () => {
      const file = $('file').files[0]; if (!file) return;
      if (file.size > 1000000) throw new Error('Choose a text file smaller than 1 MB.');
      const text = await file.text();
      if (text.includes('\0')) throw new Error('Please choose a plain text transcript.');
      $('transcript').value = text;
      if (!$('title').value) $('title').value = file.name.replace(/\.[^.]+$/, '');
      $('file').value = ''; update(); status('Transcript imported.');
    });
    $('send').onclick = () => run(async () => {
      LH.buildMessage(draft()); $('send').disabled = true;
      try {
        const response = await chrome.runtime.sendMessage({ type: 'LH_TRANSFER', draft: draft() });
        if (!response?.ok) throw new Error(response?.error || 'Could not open ChatGPT. Copy your message instead.');
        status('ChatGPT opened. Sign in if needed, then review and send your draft.');
      } finally { $('send').disabled = false; }
    });
    $('copy').onclick = () => run(async () => { await navigator.clipboard.writeText(LH.buildMessage(draft())); status('Message copied. Paste it into ChatGPT or another chat app.'); });
    $('download').onclick = () => run(async () => {
      const blob = new Blob([LH.buildMessage(draft())], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = ($('title').value.replace(/[^a-z0-9 _-]/gi, '').slice(0,80) || 'lecture') + '.txt'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); status('Message downloaded. You can attach the file in ChatGPT.');
    });
    if (close) root.querySelector('.close').onclick = close;
    if (popup) {
      $('recover').onclick = () => run(async () => {
        const result = await chrome.runtime.sendMessage({ type: 'LH_RECOVER' });
        if (!result?.transfer) throw new Error('No recent handoff. Capture or paste a transcript to start.');
        await navigator.clipboard.writeText(result.transfer.text); status('Last handoff copied. Paste it into ChatGPT.');
      });
      $('clear').onclick = () => run(async () => {
        const result = await chrome.runtime.sendMessage({ type: 'LH_CLEAR' });
        if (!result?.ok) throw new Error('Could not clear handoffs.');
        status('Temporary handoffs cleared. Drafts already inserted in ChatGPT are unchanged.');
      });
    }
    update();
    return { refresh, focus: () => $('title').focus() };
  };
})();
