const DEFAULT_SETTINGS = {
  debugMode: false,
  linkifyUrls: true,
  spellcheck: true
};

const settingIds = Object.keys(DEFAULT_SETTINGS);
const extensionVersion = document.getElementById("extensionVersion");
const enhancedSpellcheckInput = document.getElementById("enhancedSpellcheck");
const enhancedSpellcheckSetting = document.getElementById("enhancedSpellcheckSetting");
const enhancedSpellcheckStatus = document.getElementById("enhancedSpellcheckStatus");
const openChromeLanguageSettingsButton = document.getElementById("openChromeLanguageSettings");
let enhancedSpellcheckListenerAttached = false;

function applyVersion() {
  const version = chrome.runtime?.getManifest?.().version;

  if (version) {
    extensionVersion.textContent = `v${version}`;
  }
}

function applySettings(settings) {
  settingIds.forEach((id) => {
    const input = document.getElementById(id);
    input.checked = typeof settings[id] === "boolean" ? settings[id] : DEFAULT_SETTINGS[id];
  });
}

function setEnhancedSpellcheckUi({ checked = false, disabled = false, status }) {
  enhancedSpellcheckInput.checked = checked;
  enhancedSpellcheckInput.disabled = disabled;
  if (status) {
    enhancedSpellcheckStatus.textContent = status;
    enhancedSpellcheckStatus.hidden = true;
  }
  enhancedSpellcheckSetting.classList.toggle("is-disabled", disabled);
}

function canControlChromeSetting(levelOfControl) {
  return levelOfControl === "controllable_by_this_extension" || levelOfControl === "controlled_by_this_extension";
}

function getEnhancedSpellcheckSetting(callback) {
  if (!chrome.privacy?.services?.spellingServiceEnabled) {
    callback(null);
    return;
  }

  chrome.privacy.services.spellingServiceEnabled.get({}, (details) => {
    if (chrome.runtime.lastError) {
      callback(null);
      return;
    }

    callback(details);
  });
}

function watchEnhancedSpellcheckChanges() {
  if (enhancedSpellcheckListenerAttached || !chrome.privacy?.services?.spellingServiceEnabled) {
    return;
  }

  chrome.privacy.services.spellingServiceEnabled.onChange.addListener(refreshEnhancedSpellcheckUi);
  enhancedSpellcheckListenerAttached = true;
}

function refreshEnhancedSpellcheckUi() {
  if (!chrome.privacy?.services?.spellingServiceEnabled) {
    setEnhancedSpellcheckUi({
      disabled: true,
      status: "Not available in Chrome"
    });
    return;
  }

  watchEnhancedSpellcheckChanges();

  getEnhancedSpellcheckSetting((details) => {
    if (!details) {
      setEnhancedSpellcheckUi({
        disabled: true,
        status: "Could not read setting"
      });
      return;
    }

    const canControl = canControlChromeSetting(details.levelOfControl);

    setEnhancedSpellcheckUi({
      checked: Boolean(details.value),
      disabled: !canControl
    });
  });
}

function setEnhancedSpellcheck(enabled) {
  if (!chrome.privacy?.services?.spellingServiceEnabled) {
    refreshEnhancedSpellcheckUi();
    return;
  }

  setEnhancedSpellcheckUi({
    checked: enabled,
    disabled: true,
    status: enabled ? "Turning web service on..." : "Turning web service off..."
  });

  getEnhancedSpellcheckSetting((details) => {
    if (!details || !canControlChromeSetting(details.levelOfControl)) {
      refreshEnhancedSpellcheckUi();
      return;
    }

    chrome.privacy.services.spellingServiceEnabled.set({ value: enabled }, () => {
      if (chrome.runtime.lastError) {
        setEnhancedSpellcheckUi({
          checked: Boolean(details.value),
          disabled: false,
          status: "Could not update setting"
        });
        return;
      }

      refreshEnhancedSpellcheckUi();
    });
  });
}

function enableTargetEditorSpellcheck(callback) {
  const input = document.getElementById("spellcheck");
  input.checked = true;

  chrome.storage.sync.set({ spellcheck: true }, () => {
    callback();
  });
}

applyVersion();
chrome.storage.sync.get(DEFAULT_SETTINGS, applySettings);
refreshEnhancedSpellcheckUi();

settingIds.forEach((id) => {
  document.getElementById(id).addEventListener("change", (event) => {
    chrome.storage.sync.set({
      [id]: event.target.checked
    });
  });
});

enhancedSpellcheckInput.addEventListener("change", (event) => {
  const enabled = event.target.checked;

  if (!enabled) {
    setEnhancedSpellcheck(false);
    return;
  }

  enableTargetEditorSpellcheck(() => {
    setEnhancedSpellcheck(true);
  });
});

openChromeLanguageSettingsButton.addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://settings/languages" });
});
