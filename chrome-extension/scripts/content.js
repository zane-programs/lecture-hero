(function () {
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
    e.target.innerText = "Summarizing...";

    const title = document.querySelector("#deliveryTitle").innerText;
    const transcript = Array.from(
      document.querySelectorAll(
        '.event-tab-list[aria-label="Captions"] li .event-text'
      )
    )
      .map((text) => text.innerText.trim())
      .join(" ");

    chrome.runtime.sendMessage({
      type: "summarize",
      data: { title, transcript },
    });
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
  }

  main();
})();
