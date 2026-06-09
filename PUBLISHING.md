# MateHelper Chrome Web Store Publishing Checklist

## Distribution

- Recommended visibility: Unlisted
- Category: Productivity
- Language: English
- Package to upload: `release/matehelper-0.1.1.zip`

## Required Images

- Store screenshot: `store-assets/screenshot-1280x800.png`
- Small promotional image: `store-assets/promo-small-440x280.png`
- Optional marquee promotional image: `store-assets/promo-marquee-1400x560.png`
- Extension icon: included in the zip as `icons/icon-128.png`

## Listing Text

Use `STORE_LISTING.md` for:

- Short description
- Detailed description
- Single purpose
- Privacy practices
- Affiliation disclaimer

## Privacy Policy URL

Use a publicly reachable version of `docs/privacy.html`.

If GitHub Pages is enabled for this repo from the `docs/` folder on the `main` branch, the URL should be:

`https://acattelan77.github.io/matehelper-extension/privacy.html`

If GitHub Pages is not enabled, publish `docs/privacy.html` through another static host and paste that URL into the Chrome Web Store dashboard.

## Privacy Tab Answers

- Collects user data: No
- Sells user data: No
- Uses data for purposes unrelated to the extension's single purpose: No
- Uses data for creditworthiness or lending purposes: No
- Remote code: No
- Analytics/tracking: No

Permission justification:

`MateHelper runs only on the supported site patterns declared in the extension manifest because it needs to inspect visible page text and convert visible plain-text http:// and https:// URLs into clickable links. The extension processes this text locally in the browser and does not send, store, or collect page content.`

Single purpose:

`Make plain-text URLs clickable on supported web pages.`

## Final Local Checks

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Load the unpacked project folder.
4. Open `qa/smoke-test.html` or a supported web page.
5. Confirm plain-text URLs become clickable.
6. Confirm inputs, textareas, editable content, code blocks, and existing links are not changed.
7. Upload `release/matehelper-0.1.1.zip` to the Chrome Web Store dashboard.
