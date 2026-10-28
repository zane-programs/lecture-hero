const ui = LH.mount(document.getElementById('app'), {
  popup: true,
  capture: async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try { return await chrome.tabs.sendMessage(tab.id, { type: 'LH_CAPTURE' }); }
    catch { throw new Error('Open a Panopto lecture first. If you just installed LectureHero, reload the lecture page. You can also paste or import a transcript.'); }
  }
});
ui.refresh();
