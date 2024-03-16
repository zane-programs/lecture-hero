(function () {
  const $passInput = document.querySelector('input[type="password"]');

  function flashSaved($btn) {
    $btn.value = "saved!";
    $btn.style.pointerEvents = "none";

    // reset
    setTimeout(() => {
      $btn.value = "save";
      $btn.style.pointerEvents = null;
    }, 1000);
  }

  document.forms[0].addEventListener("submit", async (e) => {
    e.preventDefault();

    const $form = e.target;
    const $submitButton = $form.querySelector('input[type="submit"]');

    const { username, password } = Object.fromEntries(new FormData($form));

    await chrome.storage.sync.set({ credentials: { username, password } });

    flashSaved($submitButton);
  });

  function showPass() {
    this.setAttribute("type", "text");
  }
  function hidePass() {
    if (this !== document.activeElement) {
      this.setAttribute("type", "password");
    }
  }
  $passInput.addEventListener("mouseover", showPass);
  $passInput.addEventListener("focus", showPass);
  $passInput.addEventListener("mouseout", hidePass);
  $passInput.addEventListener("blur", hidePass);

  async function init() {
    const credentials = await chrome.storage.sync.get("credentials");
    if (credentials && "credentials" in credentials) {
      const { username, password } = credentials.credentials;
      document.getElementsByName("username")[0].value = username;
      document.getElementsByName("password")[0].value = password;
    }
  }

  init();
})();
