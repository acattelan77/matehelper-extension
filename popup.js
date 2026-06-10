const DEFAULT_SETTINGS = {
  debugMode: false,
  linkifyUrls: true,
  spellcheck: true
};

const settingIds = Object.keys(DEFAULT_SETTINGS);

function applySettings(settings) {
  settingIds.forEach((id) => {
    const input = document.getElementById(id);
    input.checked = typeof settings[id] === "boolean" ? settings[id] : DEFAULT_SETTINGS[id];
  });
}

chrome.storage.sync.get(DEFAULT_SETTINGS, applySettings);

settingIds.forEach((id) => {
  document.getElementById(id).addEventListener("change", (event) => {
    chrome.storage.sync.set({
      [id]: event.target.checked
    });
  });
});
