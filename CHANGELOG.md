# Changelog

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
