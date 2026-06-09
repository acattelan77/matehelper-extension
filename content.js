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
  const QUICK_MATCH_PATTERN = /https?:\/\//i;
  const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
  const HTML_ENTITY_PATTERN = /&(?:#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]+);/i;
  const MAX_URL_LENGTH = 4096;
  const MAX_URLS_PER_TEXT_NODE = 100;

  const queuedRoots = new Set();
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
        background: linear-gradient(180deg, #f5f6f7, #e4f2fb);
        border-bottom: 1px solid #63c3e3;
        border-radius: 3px;
        box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.78);
        color: #0889b3;
        cursor: pointer;
        font-weight: 600;
        overflow-wrap: anywhere;
        padding: 0 0.16em;
        text-decoration: none;
        transition:
          background 160ms ease,
          border-color 160ms ease,
          box-shadow 160ms ease,
          color 160ms ease;
      }

      @media (hover: hover) {
        a[${GENERATED_LINK_ATTR}="true"]:hover {
          background: linear-gradient(180deg, #e4f2fb, #63c3e3);
          border-color: #f2711c;
          box-shadow:
            inset 0 -1px 0 rgba(242, 113, 28, 0.28),
            0 1px 0 rgba(0, 43, 90, 0.08);
          color: #002b5a;
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

  function createAnchor(url, label) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = label;
    anchor.setAttribute(GENERATED_LINK_ATTR, "true");
    anchor.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    return anchor;
  }

  function buildReplacementFragment(text) {
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let match;
    let urlCount = 0;

    URL_PATTERN.lastIndex = 0;

    while ((match = URL_PATTERN.exec(text)) !== null) {
      const [fullMatch] = match;
      const start = match.index;

      if (urlCount >= MAX_URLS_PER_TEXT_NODE) {
        break;
      }

      if (start > cursor) {
        fragment.append(document.createTextNode(text.slice(cursor, start)));
      }

      const { url: strippedUrl, trailing } = stripTrailingPunctuation(fullMatch);
      const normalizedUrl = normalizeUrl(strippedUrl);
      const originalDisplayText = trailing ? fullMatch.slice(0, -trailing.length) : fullMatch;

      if (normalizedUrl) {
        fragment.append(createAnchor(normalizedUrl, originalDisplayText));
      } else {
        fragment.append(document.createTextNode(originalDisplayText));
      }

      if (trailing) {
        fragment.append(document.createTextNode(trailing));
      }

      cursor = start + fullMatch.length;
      urlCount += 1;
    }

    if (cursor === 0) {
      return null;
    }

    if (cursor < text.length) {
      fragment.append(document.createTextNode(text.slice(cursor)));
    }

    return fragment;
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
    }
  }

  function start() {
    ensureGeneratedLinkStyles();
    queueRoot(document.body || document.documentElement);

    const observer = new MutationObserver(handleMutations);
    observer.observe(document.documentElement, {
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
