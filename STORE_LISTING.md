# MateHelper Store Listing Draft

## Short Description

Unofficial helper that turns plain-text URLs on supported web pages into clickable links.

## Detailed Description

MateHelper is an unofficial Chrome extension. It is not affiliated with, endorsed by, sponsored by, or officially connected to any third-party platform, customer, or vendor.

MateHelper finds plain-text `http://` and `https://` URLs in supported page content and turns them into clickable links that open in a new tab.

It also watches dynamically rendered content, such as modals and popups, so links that appear after the page loads can still become clickable.

MateHelper is intentionally minimal:

- Runs only on the supported site patterns declared in the extension manifest.
- Requests no Chrome extension permissions.
- Does not use a background worker.
- Does not collect, store, transmit, or analyze user data.
- Does not use analytics, tracking, or remote code.
- Skips existing links, editable fields, form controls, buttons, and code blocks.

## Privacy Practices

MateHelper does not collect user data.

It processes page text locally in the browser only to detect visible plain-text URLs. No page content or browsing data is sent anywhere.

Chrome Web Store privacy tab suggestions:

- Single purpose: Make plain-text URLs clickable on supported web pages.
- Data collection: The extension does not collect user data.
- Data usage: Page text is processed locally in the browser only to identify plain-text URLs.
- Data sale or transfer: No user data is sold, shared, transferred, or sent to third parties.
- Remote code: The extension does not use remote code.
- Analytics/tracking: The extension does not use analytics, tracking, cookies, or external servers.
- Permission justification: The extension runs only on the supported site patterns declared in the manifest because it needs to inspect visible page text and replace plain-text URLs with clickable links. It requests no additional Chrome extension permissions.

## Single Purpose

MateHelper's single purpose is to make plain-text URLs clickable on supported web pages.

## Affiliation Disclaimer

MateHelper is an independent, unofficial helper extension. MateHelper is not part of any third-party platform, customer, vendor, or official product.
