const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { extract, buildMessage, presets } = require('../scripts/core.js');
const script = name => fs.readFileSync(path.join(__dirname, '../scripts', name), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
const draft = { title: 'Lecture 1', transcript: 'First concept. Second concept.', prompt: presets.notes.prompt };
function dom(html, url = 'https://school.panopto.com/Panopto/Pages/Viewer.aspx?id=1') {
  const d = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  Object.defineProperty(d.window.HTMLElement.prototype, 'innerText', { get() { return this.textContent; }, set(text) { this.textContent = text; } });
  return d;
}
test('preserves original full caption-list extraction, including repeated captions', () => {
  const d = dom('<h1 id="deliveryTitle">Lecture</h1><ul class="event-tab-list" aria-label="Captions"><li><span class="event-text"> First </span></li><li style="display:none"><span class="event-text">Second</span></li><li><span class="event-text">Second</span></li></ul><p class="event-text">Not a caption</p>');
  assert.deepEqual(extract(d.window.document), { title: 'Lecture', transcript: 'First Second Second' });
  d.window.close();
});
test('builds full message without truncating long or Unicode transcripts', () => {
  const transcript = '∑ αβ <script>text</script>\n'.repeat(5000);
  const result = buildMessage({ ...draft, transcript });
  assert.ok(result.includes(transcript.trim()));
  assert.throws(() => buildMessage({ ...draft, transcript: ' ' }), /transcript first/);
  assert.throws(() => buildMessage({ ...draft, prompt: '' }), /instructions/);
  assert.throws(() => buildMessage({ ...draft, transcript: 'a'.repeat(1000001) }), /too large/);
});
function background() {
  let listener; let removed;
  const data = {}; const calls = []; let nextTab = 10;
  const chrome = {
    runtime: { getURL: p => 'chrome-extension://test/' + p, onMessage: { addListener: f => listener = f } },
    storage: { session: {
      get: async k => k === null ? { ...data } : { [k]: data[k] },
      set: async values => Object.assign(data, values),
      remove: async keys => { for (const k of [keys].flat()) delete data[k]; },
      clear: async () => { for (const k of Object.keys(data)) delete data[k]; }
    } },
    tabs: {
      create: async options => { calls.push(['create', options]); return { id: nextTab++ }; },
      update: async (id, options) => { assert.ok(data[`transfer:${id}`]); calls.push(['update', options]); },
      remove: async () => {}, onRemoved: { addListener: f => removed = f }
    }
  };
  vm.runInNewContext(script('background.js'), { chrome, importScripts() {}, LH: { buildMessage }, URL, Date });
  return { data, calls, removed: id => removed(id), send: (type, sender, extra = {}) => new Promise(resolve => listener({ type, ...extra }, sender, resolve)) };
}
const source = { frameId: 0, url: 'https://school.panopto.com/Panopto/Pages/Viewer.aspx?id=1', tab: { id: 1 } };
const chat = id => ({ frameId: 0, url: 'https://chatgpt.com/', tab: { id } });
test('handoff is bound to its new tab and never puts transcript in URLs', async () => {
  const bg = background();
  assert.equal((await bg.send('LH_TRANSFER', source, { draft })).ok, true);
  assert.equal(bg.calls[1][1].url, 'https://chatgpt.com/');
  assert.equal((await bg.send('LH_PENDING', chat(99))).transfer, null);
  assert.equal((await bg.send('LH_PENDING', chat(10))).transfer.text, buildMessage(draft));
  assert.equal((await bg.send('LH_PENDING', { ...chat(10), frameId: 1 })).ok, false);
  assert.equal((await bg.send('LH_TRANSFER', { ...source, url: 'https://evilpanopto.com/Viewer.aspx' }, { draft })).ok, false);
  await bg.send('LH_DONE', chat(10));
  assert.equal((await bg.send('LH_PENDING', chat(10))).transfer, null);
});
test('concurrent lectures remain separate; expiry and tab closure remove transfers', async () => {
  const bg = background();
  await Promise.all([bg.send('LH_TRANSFER', source, { draft }), bg.send('LH_TRANSFER', source, { draft: { ...draft, title: 'Other lecture' } })]);
  assert.notEqual(bg.data['transfer:10'].text, bg.data['transfer:11'].text);
  bg.data['transfer:10'].created = Date.now() - 31 * 60 * 1000;
  assert.equal((await bg.send('LH_PENDING', chat(10))).transfer, null);
  bg.removed(11); await tick(); assert.equal(bg.data['transfer:11'], undefined);
});
test('popup recovery is restricted and clear removes all temporary text', async () => {
  const bg = background(); await bg.send('LH_TRANSFER', source, { draft });
  assert.equal((await bg.send('LH_RECOVER', chat(10))).ok, false);
  const popup = { url: 'chrome-extension://test/html/popup.html' };
  assert.equal((await bg.send('LH_RECOVER', popup)).transfer.text, buildMessage(draft));
  await bg.send('LH_CLEAR', popup); assert.equal(Object.keys(bg.data).length, 0);
});
test('panel captures captions, edits prompt, previews safely, transfers, and reports failures', async () => {
  const d = dom('<main></main>'); const { window: w } = d; let sent;
  w.chrome = { runtime: { getURL: x => x, sendMessage: async m => { sent = m; return { ok: true }; } }, storage: { local: { get: async () => ({}), set: async () => {} } } };
  w.eval(script('core.js')); w.eval(script('ui.js'));
  const ui = w.LH.mount(w.document.querySelector('main'), { capture: () => ({ title: '<img src=x onerror=alert(1)>', transcript: draft.transcript }) });
  await ui.refresh(); const $ = id => w.document.getElementById('lh-' + id);
  assert.equal($('transcript').value, draft.transcript);
  assert.equal(w.document.querySelectorAll('img').length, 0);
  $('preset').value = 'quiz'; $('preset').dispatchEvent(new w.Event('change'));
  assert.match($('preview').value, /practice quiz/);
  $('send').click(); await tick(); assert.equal(sent.type, 'LH_TRANSFER'); assert.equal($('send').disabled, false);
  $('transcript').value = ''; $('send').click(); await tick(); assert.match($('status').textContent, /transcript first/);
  d.window.close();
});
async function chatFixture(value = '') {
  const d = dom('<textarea id="prompt-textarea"></textarea>', 'https://chatgpt.com/'); const w = d.window;
  let interval; let done = false; let root;
  const attach = w.Element.prototype.attachShadow;
  w.Element.prototype.attachShadow = function(options) { root = attach.call(this, { ...options, mode: 'open' }); return root; };
  w.HTMLElement.prototype.getClientRects = () => [1];
  w.setInterval = f => { interval = f; return 1; }; w.clearInterval = () => {};
  w.chrome = { runtime: { sendMessage: async m => { if (m.type === 'LH_DONE') done = true; return { transfer: { text: buildMessage(draft) } }; } } };
  w.document.querySelector('textarea').value = value;
  w.eval(script('chatgpt.js')); await tick();
  return { d, w, root, run: () => interval(), done: () => done };
}
test('ChatGPT adapter inserts full draft without submitting it', async () => {
  const f = await chatFixture(); f.run(); await tick();
  assert.equal(f.w.document.querySelector('textarea').value, buildMessage(draft));
  assert.equal(f.done(), true); assert.match(f.root.querySelector('p').textContent, /press Send/); f.d.window.close();
});
test('ChatGPT adapter preserves existing draft and permits explicit retry', async () => {
  const f = await chatFixture('My own unsent draft'); f.run();
  assert.equal(f.w.document.querySelector('textarea').value, 'My own unsent draft'); assert.equal(f.done(), false);
  f.w.document.querySelector('textarea').value = ''; f.root.querySelector('#insert').click(); await tick();
  assert.equal(f.done(), true); f.d.window.close();
});
test('manifest has only scoped content scripts and no backend permissions', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json')));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.host_permissions, undefined);
  assert.deepEqual(manifest.permissions, ['storage', 'clipboardWrite', 'activeTab']);
  for (const entry of manifest.content_scripts) for (const file of entry.js) assert.ok(fs.existsSync(path.join(__dirname, '..', file)));
});
