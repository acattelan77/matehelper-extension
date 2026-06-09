# MateHelper

MateHelper is an unofficial Chrome extension for Matecat users. It converts plain-text `http://` and `https://` URLs into clickable links.

MateHelper is not affiliated with, endorsed by, sponsored by, or officially connected to Matecat or Translated srl.

## Install

Install MateHelper from its Chrome Web Store listing once it is published.

For local development or review:

1. Download and unzip `release/matehelper-0.1.0.zip`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the unzipped MateHelper extension folder.

## Behavior

- Runs only on `matecat.com` and its subdomains.
- Converts plain-text URLs into links that open in a new tab.
- Watches for dynamically rendered content, including modals and popups.
- Skips existing links, form fields, editable content, and code blocks.
- Does not include any backend service, side panel, style-guide lookup, or configuration UI.
- Does not collect, store, transmit, or analyze user data.

## Release Package

The Chrome Web Store package is `release/matehelper-0.1.0.zip`.

It contains only:

- `manifest.json`
- `content.js`
- `icons/icon-16.png`
- `icons/icon-32.png`
- `icons/icon-48.png`
- `icons/icon-128.png`

Store submission support:

- `PRIVACY.md` contains the privacy statement.
- `docs/privacy.html` contains a static privacy policy page for hosting.
- `STORE_LISTING.md` contains draft listing copy.
- `PUBLISHING.md` contains the Chrome Web Store submission checklist and field text.
- `store-assets/` contains Chrome Web Store image assets.

## Smoke Test

Open `qa/smoke-test.html` in Chrome. The page loads the same `content.js` directly and includes normal URLs, trailing punctuation, existing links, editable fields, dynamic content, entity text, and a long URL-like string.
