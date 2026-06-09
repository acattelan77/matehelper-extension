(() => {
  const GENERATED_LINK_ATTR = "data-matehelper-generated";
  const GENERATED_LINK_STYLE_ID = "matehelper-generated-link-styles";
  const CONTENT_EDITABLE_SELECTOR = [
    '[contenteditable=""]',
    '[contenteditable="true"]',
    '[contenteditable="plaintext-only"]'
  ].join(",");
  const SKIP_SELECTOR = [
    "a",
    "script",
    "style",
    "noscript",
    "textarea",
    "input",
    "select",
    "option",
    "button",
    "code",
    "pre",
    "kbd",
    "samp"
  ].join(",");
  const QUICK_MATCH_PATTERN = /https?:\/\/|<a\b/i;
  const ANCHOR_TAG_PATTERN = /<a\b(?=[^>]*\bhref\s*=)[^>]*>[\s\S]*?<\/a>/gi;
  const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
  const HTML_ENTITY_PATTERN = /&(?:#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]+);/i;
  const MAX_URL_LENGTH = 4096;
  const MAX_URLS_PER_TEXT_NODE = 100;
  // Unsupported regional variants fall back to the base spellcheck dictionary when possible.
  const CHROME_SPELLCHECK_LANGUAGES = new Set([
    "af", "bg", "ca", "cs", "da", "de", "el", "en-AU", "en-CA", "en-GB", "en-US",
    "es", "es-419", "es-AR", "es-ES", "es-MX", "es-US", "et", "fa", "fo", "fr",
    "he", "hi", "hr", "hu", "id", "it", "ko", "lt", "lv", "nb", "nl", "pl",
    "pt-BR", "pt-PT", "ro", "ru", "sh", "sk", "sl", "sq", "sr", "sv", "ta",
    "tg", "tr", "uk", "vi"
  ]);
  const TARGET_EDITABLE_SELECTOR = [
    "[data-sid]",
    "[data-sid] textarea",
    "[data-sid] [contenteditable]",
    "textarea[data-sid]",
    ".target.item",
    ".targetarea",
    ".targetarea textarea",
    ".targetarea [contenteditable]",
    "[data-testid='simple-editor-test']",
    "[data-target-lang] textarea",
    "[data-target-lang] [contenteditable]",
    "[class*='target'] textarea",
    "[class*='target'] [contenteditable]",
    "[data-testid*='target'] textarea",
    "[data-testid*='target'] [contenteditable]"
  ].join(",");
  const LANGUAGE_PAIR_SEGMENT_PATTERN = /^([a-z]{2,3}(?:-[a-z0-9]{2,8})?)-([a-z]{2,3}(?:-[a-z0-9]{2,8})?)$/i;

  const queuedRoots = new Set();
  const enhancedAnchors = new WeakSet();
  let flushScheduled = false;
  let observerSuppressed = false;

  function ensureGeneratedLinkStyles() {
    if (document.getElementById(GENERATED_LINK_STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = GENERATED_LINK_STYLE_ID;
    style.textContent = `
      a[${GENERATED_LINK_ATTR}="true"] {
        background-color: rgba(0, 153, 204, 0.08);
        border-radius: 4px;
        color: #006f94;
        cursor: pointer;
        font-weight: 600;
        overflow-wrap: anywhere;
        padding: 0 0.12em;
        text-decoration-color: rgba(0, 111, 148, 0.42);
        text-decoration-line: underline;
        text-decoration-thickness: 0.08em;
        text-underline-offset: 0.16em;
        transition:
          background-color 140ms ease,
          color 140ms ease,
          text-decoration-color 140ms ease;
      }

      @media (hover: hover) {
        a[${GENERATED_LINK_ATTR}="true"]:hover {
          background-color: rgba(0, 153, 204, 0.14);
          color: #004c66;
          text-decoration-color: #f2711c;
        }
      }

      a[${GENERATED_LINK_ATTR}="true"]:focus-visible {
        outline: 2px solid #f2711c;
        outline-offset: 2px;
      }
    `;

    (document.head || document.documentElement).append(style);
  }

  function isGeneratedLink(node) {
    return node?.nodeType === Node.ELEMENT_NODE && node.hasAttribute(GENERATED_LINK_ATTR);
  }

  function isEditable(node) {
    const parent = node?.parentElement;
    return Boolean(parent && (parent.isContentEditable || parent.closest(CONTENT_EDITABLE_SELECTOR)));
  }

  function normalizeLanguageCode(rawLanguage) {
    const parts = String(rawLanguage || "")
      .replaceAll("_", "-")
      .split("-")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0 || !/^[a-z]{2,3}$/i.test(parts[0])) {
      return null;
    }

    return parts
      .map((part, index) => {
        if (index === 0) {
          return part.toLowerCase();
        }
        if (/^[a-z]{2,3}$/i.test(part)) {
          return part.toUpperCase();
        }
        return part.toLowerCase();
      })
      .join("-");
  }

  function spellcheckLanguageFor(rawLanguage) {
    const normalizedLanguage = normalizeLanguageCode(rawLanguage);

    if (!normalizedLanguage) {
      return null;
    }

    if (CHROME_SPELLCHECK_LANGUAGES.has(normalizedLanguage)) {
      return normalizedLanguage;
    }

    const baseLanguage = normalizedLanguage.split("-")[0];
    return CHROME_SPELLCHECK_LANGUAGES.has(baseLanguage) ? baseLanguage : normalizedLanguage;
  }

  function targetLanguageFromPair(rawSource, rawTarget) {
    const sourceLanguage = normalizeLanguageCode(rawSource);
    const targetLanguage = spellcheckLanguageFor(rawTarget);
    return sourceLanguage && targetLanguage ? targetLanguage : null;
  }

  function inferTargetLanguageFromPath(pathname) {
    for (const segment of pathname.split("/")) {
      const match = segment.match(LANGUAGE_PAIR_SEGMENT_PATTERN);
      const targetLanguage = match ? targetLanguageFromPair(match[1], match[2]) : null;

      if (targetLanguage) {
        return targetLanguage;
      }
    }

    return null;
  }

  function inferTargetLanguageFromClassName() {
    for (const element of document.querySelectorAll("[class*='target-']")) {
      const className = typeof element.className === "string" ? element.className : "";
      const targetClass = className.split(/\s+/).find((name) => /^target-[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/i.test(name));
      const targetLanguage = targetClass ? spellcheckLanguageFor(targetClass.slice("target-".length)) : null;

      if (targetLanguage) {
        return targetLanguage;
      }
    }

    return null;
  }

  function inferTargetLanguage() {
    const directElement = document.querySelector("[data-target-lang], [data-target-language]");
    const directLanguage = spellcheckLanguageFor(
      directElement?.getAttribute("data-target-lang") || directElement?.getAttribute("data-target-language")
    );

    if (directLanguage) {
      return directLanguage;
    }

    const langPairElement = document.querySelector("[data-langpair], [data-lang-pair]");
    const rawLangPair = langPairElement?.getAttribute("data-langpair") || langPairElement?.getAttribute("data-lang-pair") || "";
    const [rawSource, rawTarget] = rawLangPair.split(/[_>]/);
    const langPairTarget = rawSource && rawTarget ? targetLanguageFromPair(rawSource, rawTarget) : null;

    if (langPairTarget) {
      return langPairTarget;
    }

    return inferTargetLanguageFromPath(window.location.pathname) || inferTargetLanguageFromClassName();
  }

  function shouldSkipTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) {
      return true;
    }

    const text = node.textContent;
    const parent = node.parentElement;

    if (!parent || !text || !text.trim()) {
      return true;
    }

    if (!QUICK_MATCH_PATTERN.test(text)) {
      return true;
    }

    if (parent.closest(SKIP_SELECTOR)) {
      return true;
    }

    if (parent.closest(`[${GENERATED_LINK_ATTR}]`)) {
      return true;
    }

    if (isEditable(node)) {
      return true;
    }

    return false;
  }

  function stripTrailingPunctuation(rawUrl) {
    let openParenCount = 0;
    let closeParenCount = 0;
    let openBracketCount = 0;
    let closeBracketCount = 0;
    let openBraceCount = 0;
    let closeBraceCount = 0;

    for (const char of rawUrl) {
      if (char === "(") openParenCount += 1;
      if (char === ")") closeParenCount += 1;
      if (char === "[") openBracketCount += 1;
      if (char === "]") closeBracketCount += 1;
      if (char === "{") openBraceCount += 1;
      if (char === "}") closeBraceCount += 1;
    }

    let end = rawUrl.length;

    while (end > 0) {
      const lastChar = rawUrl[end - 1];
      const isSimplePunctuation = /[.,!?;:]/.test(lastChar);
      const hasUnbalancedClosingParen = lastChar === ")" && openParenCount < closeParenCount;
      const hasUnbalancedClosingBracket = lastChar === "]" && openBracketCount < closeBracketCount;
      const hasUnbalancedClosingBrace = lastChar === "}" && openBraceCount < closeBraceCount;

      if (!isSimplePunctuation && !hasUnbalancedClosingParen && !hasUnbalancedClosingBracket && !hasUnbalancedClosingBrace) {
        break;
      }

      if (lastChar === "(") openParenCount -= 1;
      if (lastChar === ")") closeParenCount -= 1;
      if (lastChar === "[") openBracketCount -= 1;
      if (lastChar === "]") closeBracketCount -= 1;
      if (lastChar === "{") openBraceCount -= 1;
      if (lastChar === "}") closeBraceCount -= 1;

      end -= 1;
    }

    return {
      url: rawUrl.slice(0, end),
      trailing: rawUrl.slice(end)
    };
  }

  function normalizeUrl(rawUrl) {
    const visibleUrl = rawUrl.trim();

    if (!visibleUrl || visibleUrl.length > MAX_URL_LENGTH || HTML_ENTITY_PATTERN.test(visibleUrl)) {
      return null;
    }

    try {
      const url = new URL(visibleUrl, document.baseURI);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return null;
      }

      return url.href;
    } catch {
      return null;
    }
  }

  function handleLinkClick(event) {
    event.stopPropagation();
  }

  function createAnchor(url, label) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = label;
    anchor.setAttribute(GENERATED_LINK_ATTR, "true");
    anchor.addEventListener("click", handleLinkClick);
    return anchor;
  }

  function parseLiteralAnchor(rawAnchor) {
    const template = document.createElement("template");
    template.innerHTML = rawAnchor;

    const anchor = template.content.querySelector("a[href]");
    const rawHref = anchor?.getAttribute("href") || "";
    const label = anchor?.textContent || "";
    const normalizedUrl = normalizeUrl(rawHref);

    if (!normalizedUrl || !label.trim()) {
      return null;
    }

    return {
      label,
      url: normalizedUrl
    };
  }

  function isInsideLiteralAnchorOpening(text, offset) {
    const openAnchorIndex = text.lastIndexOf("<a", offset);

    if (openAnchorIndex === -1) {
      return false;
    }

    const lastCloseIndex = text.lastIndexOf(">", offset);
    const lastEndAnchorIndex = text.lastIndexOf("</a", offset);

    if (lastCloseIndex > openAnchorIndex || lastEndAnchorIndex > openAnchorIndex) {
      return false;
    }

    return /\bhref\s*=\s*["']?[^"'\s<>]*$/i.test(text.slice(openAnchorIndex, offset));
  }

  function appendLinkifiedText(fragment, text, state) {
    let cursor = 0;
    let match;
    let changed = false;

    URL_PATTERN.lastIndex = 0;

    while ((match = URL_PATTERN.exec(text)) !== null) {
      const [fullMatch] = match;
      const start = match.index;

      if (state.urlCount >= MAX_URLS_PER_TEXT_NODE) {
        break;
      }

      if (start > cursor) {
        fragment.append(document.createTextNode(text.slice(cursor, start)));
      }

      if (isInsideLiteralAnchorOpening(text, start)) {
        fragment.append(document.createTextNode(fullMatch));
        cursor = start + fullMatch.length;
        continue;
      }

      const { url: strippedUrl, trailing } = stripTrailingPunctuation(fullMatch);
      const normalizedUrl = normalizeUrl(strippedUrl);
      const originalDisplayText = trailing ? fullMatch.slice(0, -trailing.length) : fullMatch;

      if (normalizedUrl) {
        fragment.append(createAnchor(normalizedUrl, originalDisplayText));
        changed = true;
      } else {
        fragment.append(document.createTextNode(originalDisplayText));
      }

      if (trailing) {
        fragment.append(document.createTextNode(trailing));
      }

      cursor = start + fullMatch.length;
      state.urlCount += 1;
    }

    if (cursor === 0) {
      fragment.append(document.createTextNode(text));
      return changed;
    }

    if (cursor < text.length) {
      fragment.append(document.createTextNode(text.slice(cursor)));
    }

    return changed;
  }

  function buildReplacementFragment(text) {
    const fragment = document.createDocumentFragment();
    const state = { urlCount: 0 };
    let cursor = 0;
    let match;
    let changed = false;

    ANCHOR_TAG_PATTERN.lastIndex = 0;

    while ((match = ANCHOR_TAG_PATTERN.exec(text)) !== null) {
      const [fullMatch] = match;
      const start = match.index;

      if (start > cursor) {
        changed = appendLinkifiedText(fragment, text.slice(cursor, start), state) || changed;
      }

      const parsedAnchor = parseLiteralAnchor(fullMatch);

      if (parsedAnchor) {
        fragment.append(createAnchor(parsedAnchor.url, parsedAnchor.label));
        changed = true;
      } else {
        fragment.append(document.createTextNode(fullMatch));
      }

      cursor = start + fullMatch.length;
    }

    if (cursor < text.length) {
      changed = appendLinkifiedText(fragment, text.slice(cursor), state) || changed;
    } else if (cursor === 0) {
      changed = appendLinkifiedText(fragment, text, state) || changed;
    }

    return changed ? fragment : null;
  }

  function enhanceExistingAnchor(anchor) {
    if (
      !(anchor instanceof HTMLAnchorElement) ||
      isGeneratedLink(anchor) ||
      enhancedAnchors.has(anchor) ||
      isEditable(anchor)
    ) {
      return;
    }

    const normalizedUrl = normalizeUrl(anchor.getAttribute("href") || "");

    if (!normalizedUrl) {
      return;
    }

    anchor.addEventListener("click", handleLinkClick);
    enhancedAnchors.add(anchor);
  }

  function enhanceExistingAnchors(root) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    if (root.matches("a[href]")) {
      enhanceExistingAnchor(root);
    }

    root.querySelectorAll("a[href]").forEach(enhanceExistingAnchor);
  }

  function canLinkifyLiteralAnchorContainer(element) {
    if (!(element instanceof Element) || element.closest(SKIP_SELECTOR) || isEditable(element)) {
      return false;
    }

    if (!element.textContent || !/<a\b/i.test(element.textContent)) {
      return false;
    }

    return Array.from(element.childNodes).every((child) => child.nodeType === Node.TEXT_NODE);
  }

  function linkifyLiteralAnchorContainer(element) {
    if (!canLinkifyLiteralAnchorContainer(element)) {
      return false;
    }

    const replacement = buildReplacementFragment(element.textContent);

    if (!replacement) {
      return false;
    }

    observerSuppressed = true;
    try {
      element.replaceChildren(replacement);
    } finally {
      observerSuppressed = false;
    }

    return true;
  }

  function linkifyLiteralAnchorContainers(root) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const candidates = [];

    if (canLinkifyLiteralAnchorContainer(root)) {
      candidates.push(root);
    }

    root.querySelectorAll("*").forEach((element) => {
      if (canLinkifyLiteralAnchorContainer(element)) {
        candidates.push(element);
      }
    });

    candidates.forEach(linkifyLiteralAnchorContainer);
  }

  function canApplyTargetSpellcheck(element) {
    return (
      element instanceof HTMLElement &&
      !element.closest("script, style, noscript, code, pre, kbd, samp, input, select, option, button") &&
      !element.closest("[data-original]")
    );
  }

  function applyTargetSpellcheckToElement(element, targetLanguage) {
    if (!canApplyTargetSpellcheck(element)) {
      return;
    }

    if (element.getAttribute("lang") !== targetLanguage) {
      element.setAttribute("lang", targetLanguage);
    }

    if (element.getAttribute("spellcheck") !== "true") {
      element.setAttribute("spellcheck", "true");
    }

    if ("spellcheck" in element && element.spellcheck !== true) {
      element.spellcheck = true;
    }
  }

  function applyTargetSpellcheck(root) {
    const targetLanguage = inferTargetLanguage();

    if (!targetLanguage || !root || root.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const targets = [];

    if (root.matches(TARGET_EDITABLE_SELECTOR)) {
      targets.push(root);
    }

    root.querySelectorAll(TARGET_EDITABLE_SELECTOR).forEach((element) => {
      targets.push(element);
    });

    targets.forEach((element) => {
      applyTargetSpellcheckToElement(element, targetLanguage);

      if (element.matches("[data-sid], .targetarea, .target.item, [data-testid='simple-editor-test'], [data-target-lang], [data-target-language]")) {
        element.querySelectorAll("textarea, [contenteditable]").forEach((editable) => {
          applyTargetSpellcheckToElement(editable, targetLanguage);
        });
      }
    });
  }

  function linkifyTextNode(node) {
    if (shouldSkipTextNode(node)) {
      return;
    }

    const replacement = buildReplacementFragment(node.textContent);

    if (!replacement) {
      return;
    }

    observerSuppressed = true;
    try {
      node.replaceWith(replacement);
    } finally {
      observerSuppressed = false;
    }
  }

  function processRoot(root) {
    if (!root) {
      return;
    }

    if (root.nodeType === Node.TEXT_NODE) {
      linkifyTextNode(root);
      return;
    }

    applyTargetSpellcheck(root);
    linkifyLiteralAnchorContainers(root);
    enhanceExistingAnchors(root);

    const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let currentNode = treeWalker.nextNode();

    while (currentNode) {
      if (!shouldSkipTextNode(currentNode)) {
        textNodes.push(currentNode);
      }
      currentNode = treeWalker.nextNode();
    }

    textNodes.forEach(linkifyTextNode);
  }

  function flushQueue() {
    flushScheduled = false;

    const roots = Array.from(queuedRoots);
    queuedRoots.clear();

    roots.forEach(processRoot);
  }

  function queueRoot(root) {
    if (!root || isGeneratedLink(root)) {
      return;
    }

    queuedRoots.add(root);

    if (flushScheduled) {
      return;
    }

    flushScheduled = true;
    window.requestAnimationFrame(flushQueue);
  }

  function handleMutations(mutations) {
    if (observerSuppressed) {
      return;
    }

    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        queueRoot(mutation.target);
      }

      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          queueRoot(node);
        });
      }

      if (mutation.type === "attributes") {
        queueRoot(mutation.target);
      }
    }
  }

  function start() {
    ensureGeneratedLinkStyles();
    queueRoot(document.body || document.documentElement);

    const observer = new MutationObserver(handleMutations);
    observer.observe(document.documentElement, {
      attributeFilter: ["class", "contenteditable", "data-sid", "data-target-lang", "data-target-language", "data-testid", "spellcheck", "lang"],
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
