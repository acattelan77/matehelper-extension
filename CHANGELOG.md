# Changelog

## 0.3.7

- Updated popup copy for URL links, target language, enhanced spellcheck, Chrome spellcheck, and diagnostics.
- Replaced the Chrome language settings text button with an aligned icon button.
- Reordered popup controls and hid the enhanced web-service status label.
- Updated popup labels to Chrome Spell Check, Set Target Language, Enhanced Chrome Spell Check, Clickable URLs, and Diagnostics.
- Clarified Set Target Language copy to describe it as helping Chrome use the Matecat target language for spellcheck.

## 0.3.6

- Replaced the Chrome spellcheck warning with an explicit status block.
- Clarified that Chrome's main spellcheck status cannot be read by extensions.

## 0.3.5

- Added a popup note that Chrome spell check must be enabled in Chrome settings.
- Added an Open Chrome language settings button.

## 0.3.4

- Clarified that Enhanced Chrome Spell Check controls Chrome's web-service spellcheck only.
- Updated the popup status to avoid implying that MateHelper enabled Chrome's main spellcheck setting.

## 0.3.3

- Added the extension version to the popup.
- Made popup checkboxes fixed-size and aligned.
- Made Enhanced Chrome Spell Check re-enable Target Editor Spellcheck so Matecat editors remain eligible for spellchecking.
- Moved Chrome `privacy` access to required permissions for reliable Enhanced Chrome Spell Check control.

## 0.3.2

- Renamed the popup spellcheck controls to Target Editor Spellcheck and Enhanced Chrome Spell Check.
- Kept Target Editor Spellcheck enabled by default.
- Clarified that target-editor spellcheck and Chrome's enhanced web-service spellcheck are separate controls.

## 0.3.1

- Added an optional popup control for Chrome Enhanced Spell Check.
- Added optional Chrome `privacy` permission support for updating Chrome's spellcheck web-service setting after user opt-in.
- Updated privacy and store-submission notes for the optional Chrome Enhanced Spell Check behavior.

## 0.3.0

- Added a toolbar popup for clickable URL, spellcheck, and diagnostics preferences.
- Added Chrome storage support for feature preferences.
- Made target spellcheck more resilient to Matecat focus changes and editor re-renders.
- Stopped changing behavior on existing Matecat-created links.
- Added self-checking smoke-test output to `qa/smoke-test.html`.
- Reduced content-script injection to the top Matecat frame.
- Updated visual assets and rebuilt the release package.

## 0.2.0

- Added target-language spellcheck support.
- Added updated Chrome Web Store release assets.

## 0.1.2

- Added clickable URL and literal anchor reference handling.
