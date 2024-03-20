import { useCallback, useState } from "react";
import styles from "./index.module.css";
import { createAccount } from "../../utils/api";

import CHROME_EXTENSION_ZIP_FILE from "../../assets/lecturehero-chrome-extension.zip";

export default function Home() {
  const [accountWasCreated, setAccountWasCreated] = useState(true);

  return (
    <main className={styles.homeMain}>
      {accountWasCreated ? (
        <InstallationInstructions />
      ) : (
        <CreateAccount setAccountWasCreated={setAccountWasCreated} />
      )}
    </main>
  );
}

function CreateAccount({
  setAccountWasCreated,
}: {
  setAccountWasCreated: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    async (e) => {
      e.preventDefault();

      // Cursed as all hell lol. The things I do for a grade...
      try {
        await createAccount(username, password);
        setAccountWasCreated(true);
      } catch (e) {
        setAccountWasCreated(false);
        console.error(e);
        alert((e as any)?.toString() ?? e);
      }
    },
    [password, setAccountWasCreated, username]
  );

  return (
    <div className={styles.createAccountContainer}>
      <h1>LectureHero</h1>
      <p>Excuse the rushed frontend y'all</p>
      <p>Create an account using the form below:</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}

function InstallationInstructions() {
  return (
    <div className={styles.createAccountContainer}>
      <h1>Install</h1>
      <p>
        <strong>Success! Account created.</strong> Now, I'll walk you through
        downloading the Chrome extension.
      </p>
      <p>
        <a href="/" target="_blank">
          Click here
        </a>{" "}
        to watch tutorial video
      </p>
      <ol>
        <li>
          Download Chrome extension ZIP (
          <a href={CHROME_EXTENSION_ZIP_FILE}>click here</a>)
        </li>
        <li>Unzip the file, and note the location of the folder created</li>
        <li>
          Go to the extensions page in Chrome or whatever Chromium-based browser
          you're using (likely chrome://extensions)
        </li>
        <li>Enable developer mode</li>
        <li>
          Click "Load unpacked" and select the unzipped folder from file picker
        </li>
        <li>Click on extension icon (blue book-looking icon) in menu bar</li>
        <li>
          Fill in your newly created username and password, then click "save"
        </li>
      </ol>
    </div>
  );
}
