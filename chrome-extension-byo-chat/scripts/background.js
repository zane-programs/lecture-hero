importScripts('core.js');
const TTL = 30 * 60 * 1000;
const CHAT = 'https://chatgpt.com/';
const key = id => `transfer:${id}`;
function isChat(sender) {
  try { return sender.frameId === 0 && new URL(sender.url).origin === 'https://chatgpt.com'; } catch { return false; }
}
function isSource(sender) {
  if (sender.url === chrome.runtime.getURL('html/popup.html')) return true;
  try {
    const url = new URL(sender.url);
    return sender.frameId === 0 && url.protocol === 'https:' && /(^|\.)panopto\.com$/.test(url.hostname) && /\/Viewer\.aspx$/i.test(url.pathname);
  } catch { return false; }
}
async function cleanup() {
  const entries = await chrome.storage.session.get(null);
  const expired = Object.entries(entries).filter(([, value]) => !value.created || Date.now() - value.created > TTL).map(([name]) => name);
  if (expired.length) await chrome.storage.session.remove(expired);
}
async function handle(message, sender) {
  await cleanup();
  if (message.type === 'LH_TRANSFER' && isSource(sender)) {
    const text = LH.buildMessage(message.draft);
    const tab = await chrome.tabs.create({ url: 'about:blank' });
    const transfer = { text, created: Date.now() };
    try {
      await chrome.storage.session.set({ [key(tab.id)]: transfer, latest: transfer });
      await chrome.tabs.update(tab.id, { url: CHAT });
    } catch (error) {
      await chrome.storage.session.remove(key(tab.id));
      await chrome.tabs.remove(tab.id).catch(() => {});
      throw error;
    }
    return { ok: true };
  }
  if (message.type === 'LH_PENDING' && isChat(sender)) {
    const data = await chrome.storage.session.get(key(sender.tab.id));
    return { ok: true, transfer: data[key(sender.tab.id)] || null };
  }
  if (message.type === 'LH_DONE' && isChat(sender)) {
    await chrome.storage.session.remove(key(sender.tab.id));
    return { ok: true };
  }
  if (message.type === 'LH_RECOVER' && sender.url === chrome.runtime.getURL('html/popup.html')) {
    return { ok: true, transfer: (await chrome.storage.session.get('latest')).latest || null };
  }
  if (message.type === 'LH_CLEAR' && sender.url === chrome.runtime.getURL('html/popup.html')) {
    await chrome.storage.session.clear();
    return { ok: true };
  }
  throw new Error('This request is not available here.');
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (!message?.type?.startsWith('LH_') || message.type === 'LH_CAPTURE') return;
  handle(message, sender).then(respond).catch(error => respond({ ok: false, error: error.message || 'Unable to open ChatGPT. Copy the draft instead.' }));
  return true;
});
chrome.tabs.onRemoved.addListener(id => { chrome.storage.session.remove(key(id)); });
