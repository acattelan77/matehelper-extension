# MateHelper Store Listing Draft

## Short Description

Unofficial Matecat helper for clickable URL references and target-language spellcheck.

## Detailed Description

MateHelper is an unofficial Chrome extension for Matecat users. It is not affiliated with, endorsed by, sponsored by, or officially connected to Matecat or Translated srl.

MateHelper improves Matecat pages in two focused ways:

- It turns visible URL references into clickable links that open in a new tab. This includes plain-text `http://` and `https://` URLs, and literal HTML anchor snippets where the visible anchor label should be clickable.
- It enables browser spellcheck on target-language editing areas when the target language can be detected from the page.
- It can optionally ask Chrome to enable Enhanced Spell Check from the popup.

It also watches dynamically rendered content, such as modals and popups, so URL references and target editing areas that appear after the page loads can still be handled.

MateHelper is intentionally minimal:

- Runs only on `matecat.com` and its subdomains, as declared in the extension manifest.
- Requests the Chrome `storage` permission for feature preferences and optional `privacy` access only if the user enables Chrome Enhanced Spell Check.
- Does not use a background worker.
- Does not collect, transmit, or analyze user data.
- Does not use analytics, tracking, or remote code.
- Skips existing links, source text, unrelated editable fields, form controls, buttons, and code blocks.

## Privacy Practices

MateHelper does not collect user data.

It processes page text and page structure locally in the browser only to detect visible URL references and target editing areas. No page content or browsing data is sent anywhere by MateHelper.

If the user enables Chrome Enhanced Spell Check from the popup, MateHelper asks Chrome to enable Chrome's spellcheck web-service setting. Chrome may then send typed text to Google's spellcheck service according to Chrome's own spellcheck behavior.

Chrome Web Store privacy tab suggestions:

- Single purpose: Improve Matecat pages by making URL references clickable and enabling target-language spellcheck in target editing areas.
- Data collection: The extension does not collect user data.
- Data usage: Page text and page structure are processed locally in the browser only to identify URL references and target editing areas.
- Data sale or transfer: No user data is sold, shared, transferred, or sent to third parties.
- Remote code: The extension does not use remote code.
- Analytics/tracking: The extension does not use analytics, tracking, cookies, or external servers.
- Permission justification: The extension runs only on `matecat.com` and its subdomains because it needs to inspect visible page text and page structure to convert URL references into clickable links and enable spellcheck on target-language editing areas. It uses the `storage` permission to save feature preferences. It requests optional `privacy` access only if the user enables Chrome Enhanced Spell Check, so it can ask Chrome to update that browser setting.

## Single Purpose

MateHelper's single purpose is to improve Matecat pages by making URL references clickable and enabling target-language spellcheck in target editing areas.

## Affiliation Disclaimer

MateHelper is an independent, unofficial helper extension for Matecat users. MateHelper is not part of Matecat, Translated srl, or any official Matecat product.
