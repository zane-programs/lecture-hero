# LectureHero BYO Chat

A standalone Manifest V3 offshoot of LectureHero. Capture a Panopto lecture, choose a study prompt, and bring the complete message into your own ChatGPT session. No LectureHero backend, credentials, API key, build step, or runtime dependencies.

## Install

1. Open `chrome://extensions` in Chrome 114+ (or a compatible Chromium browser).
2. Turn on **Developer mode**, choose **Load unpacked**, and select this `chrome-extension-byo-chat` directory.
3. Reload any open Panopto lecture tabs. Disable the original LectureHero extension if you don't want both controls.
4. Click the **LectureHero** pill at the bottom right of a lecture, or open the extension popup.

The original `chrome-extension`, `app`, `web`, and `cdk` directories remain separate and are not required by this extension.

## Use

- Open the lecture's Captions tab if necessary, then choose **Refresh from lecture**.
- Select Study notes, Practice quiz, Flashcards, or write custom instructions. Prompt preferences are remembered locally.
- Review or edit the transcript and expand **Preview complete message**.
- Choose **Continue in ChatGPT**. A new `https://chatgpt.com/` tab opens and the extension attempts to insert the prompt and transcript into an empty composer. **Review the draft and press Send in ChatGPT.** It never submits automatically.
- If sign-in or a changed ChatGPT interface prevents insertion, choose **Insert draft** after signing in, or **Copy message** and paste it yourself. The extension popup also offers **Copy last handoff**.
- For long lectures that exceed ChatGPT's current message limits, download the complete `.txt` message and attach it in ChatGPT. Nothing is silently truncated. Account/model limits still apply.
- Paste/import `.txt`, `.vtt`, or `.srt` transcripts when needed. Imported subtitles retain their timestamps and text. Copy/download also works for another chat service or manually transferring to a mobile app. Automatic mobile app handoff is not implemented.

## Original transcript mechanism

The Panopto extraction is deliberately preserved from the original extension:

```js
Array.from(document.querySelectorAll(
  '.event-tab-list[aria-label="Captions"] li .event-text'
)).map(text => text.innerText.trim()).join(' ')
```

The title comes from `#deliveryTitle`, with a document-title fallback. The extension reads the entire caption list returned by this selector, in order, without filtering, deduplicating, scrolling, fetching from a different endpoint, or truncating. It has the same dependency on Panopto populating that list as the original extension. Capture is explicit; refresh after changing lectures. Closing and reopening the in-page panel preserves edits. Closing the popup discards its unsent transcript edits.

## Data and permissions

- No network requests to LectureHero or an AI API; no telemetry, remote scripts, or stored login credentials.
- `storage`: local prompt preferences and temporary session handoffs. Transcripts are not put in sync storage. Temporary handoffs become unavailable after 30 minutes, are pruned on the next handoff operation, and are cleared when the browser session ends. **Clear handoffs** removes stored handoffs immediately; it does not erase text already inserted in a page or copied to the clipboard.
- `clipboardWrite`: copying the complete message on request.
- `activeTab`: retrieving captions from the active Panopto tab through the popup.
- Content scripts run on the original Panopto viewer URL patterns and `https://chatgpt.com/*`. The ChatGPT script only receives a draft in the specific tab created for that handoff; it leaves other chats alone.
- A transcript stays in the extension until the user initiates a handoff. Inserting a draft exposes that text to ChatGPT's page; the extension does not click Send. ChatGPT's own account and data settings apply. Transcript text never appears in a URL or extension logs.
- CSS is isolated in a shadow root, so the injected panel does not restyle Panopto. All dynamic lecture text is assigned as text or input values.

The ChatGPT composer adapter is best-effort DOM integration, **not a documented OpenAI integration API**. It retries for up to 60 seconds, offers manual retry/copy, verifies inserted text, and refuses to overwrite an existing draft. If ChatGPT changes its editor, update `scripts/chatgpt.js`; clipboard and download remain independent of that adapter. Official [ChatGPT web documentation](https://learn.chatgpt.com/docs/web) provides product context; the implementation uses Chrome's [content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) and [session storage](https://developer.chrome.com/docs/extensions/reference/api/storage).

## Development and checks

```sh
cd chrome-extension-byo-chat
npm ci
npm test
```

No build is needed. Tests cover original caption extraction, complete Unicode/long transcript messages, empty/oversized input, tab-scoped handoffs, sender restrictions, concurrent lectures, expiry/recovery, UI actions, and existing ChatGPT draft preservation. Tests use simulated DOM and extension APIs; they do not claim live Panopto or ChatGPT compatibility.

Manual integration checklist:

1. Load unpacked, open a real Panopto lecture, compare captured transcript against its full caption list.
2. Try ChatGPT while signed in and while signed out; verify insertion after login or use manual retry.
3. Confirm the message stays unsent until you press Send, and existing drafts are preserved.
4. Open two different lectures and hand off each; verify each new tab receives the correct transcript.
5. Try empty captions, a long transcript, copy, download, popup recovery, and clear handoffs.

The repository's existing license applies.
