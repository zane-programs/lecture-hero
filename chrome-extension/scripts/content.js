(function () {
  let $MENU_BAR_BUTTON;

  function waitForSelector(selector) {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  function createMenuBarButton(name) {
    const elem = document.createElement("div");
    elem.classList.add("header-dropdown-link", "action-section");
    elem.setAttribute("tabindex", "0");
    elem.setAttribute("role", "button");

    const span = document.createElement("span");
    span.appendChild(document.createTextNode(name));

    elem.appendChild(span);

    return elem;
  }

  function handleSummarizeClick(e) {
    // Base case: if summary already generated, just open it in new tab
    if (e.target.getAttribute("data-summary-id")) {
      chrome.runtime.sendMessage({
        type: "openSummary",
        data: { id: e.target.getAttribute("data-summary-id") },
      });
      return;
    }

    e.target.innerText = "Summarizing...";

    const title = document.querySelector("#deliveryTitle").innerText;
    const transcript = Array.from(
      document.querySelectorAll(
        '.event-tab-list[aria-label="Captions"] li .event-text'
      )
    )
      .map((text) => text.innerText.trim())
      .join(" ");

    chrome.runtime.sendMessage(
      {
        type: "summarize",
        data: { title, transcript },
      },
      function (summaryId) {
        if (!$MENU_BAR_BUTTON) return;

        $MENU_BAR_BUTTON.setAttribute("data-summary-id", summaryId);
        $MENU_BAR_BUTTON.innerText = "View Summary";
      }
    );
  }

  // MAIN
  async function main() {
    await waitForSelector("#viewerHeader");

    const lastHeaderLink = Array.from(
      document.querySelectorAll(
        "#viewerHeader .header-right .header-dropdown-link"
      )
    ).pop();

    const lectureHeroButton = createMenuBarButton("Summarize");
    lectureHeroButton.style.fontWeight = "700";
    lectureHeroButton.style.textAlign = "right";

    lectureHeroButton.addEventListener("click", handleSummarizeClick);

    lastHeaderLink.parentNode.insertBefore(lectureHeroButton, lastHeaderLink);

    $MENU_BAR_BUTTON = lectureHeroButton;

    chrome.runtime.onMessage.addListener(function (request) {
      console.log(request);
    });

    console.log(chrome.runtime.onMessage);
  }

  main();
})();
