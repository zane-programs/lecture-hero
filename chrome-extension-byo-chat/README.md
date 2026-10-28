# LectureHero BYO Chat

A standalone Manifest V3 offshoot of LectureHero. Capture a Panopto lecture, choose a study prompt, and bring the complete message into your own ChatGPT, Claude, or Gemini session. No LectureHero backend, credentials, API key, build step, or runtime dependencies.

## Install

1. Open `chrome://extensions` in Chrome 114+ (or a compatible Chromium browser).
2. Turn on **Developer mode**, choose **Load unpacked**, and select this `chrome-extension-byo-chat` directory.
3. Reload any open Panopto lecture tabs. Disable the original LectureHero extension if you don't want both controls.
4. Click the **LectureHero** pill at the bottom right of a lecture, or open the extension popup.

When upgrading from v2.0, reload the extension in `chrome://extensions` and reload your lecture tabs. Chrome may ask you to approve access to Claude and Gemini.

The original `chrome-extension`, `app`, `web`, and `cdk` directories remain separate and are not required by this extension.

## Use

- Open the lecture's Captions tab if necessary, then choose **Refresh from lecture**.
- Choose **ChatGPT**, **Claude**, or **Gemini** under **Your chat service**. Your choice is remembered locally; use your existing account on that service.
- Select Study notes, Practice quiz, Flashcards, or write custom instructions. Prompt preferences are remembered locally.
- Review or edit the transcript and expand **Preview complete message**.
- Choose **Continue in [service]**. A new tab opens at `https://chatgpt.com/`, `https://claude.ai/new`, or `https://gemini.google.com/app`. The extension attempts to insert the complete prompt and transcript into an empty composer. **Review the draft and press Send in your selected service.** It never submits automatically.
- If sign-in or a changed chat interface prevents insertion, choose **Insert draft** after signing in, or **Copy message** and paste it yourself. The extension popup also offers **Copy last handoff**.
- For long lectures that exceed your selected service’s current message limits, download the complete `.txt` message and attach it in your chat service. Nothing is silently truncated. Account/model limits still apply.
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
- `storage`: local provider/prompt preferences and temporary session handoffs. Transcripts are not put in sync storage. Temporary handoffs become unavailable after 30 minutes, are pruned on the next handoff operation, and are cleared when the browser session ends. **Clear handoffs** removes stored handoffs immediately; it does not erase text already inserted in a page or copied to the clipboard.
- `clipboardWrite`: copying the complete message on request.
- `activeTab`: retrieving captions from the active Panopto tab through the popup.
- Content scripts run on the original Panopto viewer URL patterns and `https://chatgpt.com/*`, `https://claude.ai/*`, and `https://gemini.google.com/*`. The chat script only receives a draft in the specific tab created for that handoff and only on the selected provider’s origin; it leaves other chats alone. Navigating that tab to another provider does not release or acknowledge the draft.
- A transcript stays in the extension until the user initiates a handoff. Inserting a draft exposes that text to the selected service’s page; the extension does not click Send. That service’s account and data settings apply. Transcript text never appears in a URL or extension logs.
- CSS is isolated in a shadow root, so the injected panel does not restyle Panopto. All dynamic lecture text is assigned as text or input values.

The composer adapters are best-effort DOM integrations, **not documented provider integration APIs**. No API subscriptions or keys are used. They retry for up to 60 seconds, offer manual retry/copy, verify inserted text, and refuse to overwrite an existing draft. Provider URLs and composer selectors are centralized in `scripts/core.js`, with shared insertion logic in `scripts/chat.js`. If a provider changes its editor, update its selector; clipboard and download remain independent of that adapter. Official [ChatGPT web documentation](https://learn.chatgpt.com/docs/web), [Claude getting started](https://support.claude.com/en/articles/8114491-get-started-with-claude), and [Gemini web help](https://support.google.com/gemini/answer/13275745?hl=en) provide product context; the implementation uses Chrome's [content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) and [session storage](https://developer.chrome.com/docs/extensions/reference/api/storage).

## Development and checks

```sh
cd chrome-extension-byo-chat
npm ci
npm test
```

No build is needed. Tests cover original caption extraction, complete Unicode/long transcript messages, empty/oversized input, tab-scoped handoffs, sender restrictions, concurrent lectures, expiry/recovery, UI actions, and existing draft preservation across all three services, provider preference persistence, unknown-provider rejection, and cross-provider isolation. Tests use simulated DOM and extension APIs; they do not claim live authenticated Panopto or provider compatibility.

Manual integration checklist:

1. Load unpacked, open a real Panopto lecture, compare captured transcript against its full caption list.
2. Try each of ChatGPT, Claude, and Gemini while signed in and while signed out; verify insertion after login or use manual retry.
3. Confirm the message stays unsent until you press Send, and existing drafts are preserved.
4. Open two different lectures and hand off each; verify each new tab receives the correct transcript.
5. Try empty captions, a long transcript, copy, download, popup recovery, and clear handoffs.

The repository's existing license applies.
