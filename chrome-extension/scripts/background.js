chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "summarize") {
    console.log(request.data);
    chrome.tabs.create({ url: "https://lecturehero.net/summary/aaa" });
  }
});
