'use strict';

// Same format as "content_scripts" in manifest.json
//
// NOTE: Field "matches" is kept for easy code movement between injection and
// manifest. It's NOT used here.
var popupOnlyContentScripts = [
  {
    "run_at": "document_start",
    "js": [ "scripts/content/doc-start-init.js",
            "scripts/content/change-ua.js" ],
    "matches": ["http://devdocs.io/*"]
  },
  {
    "run_at": "document_end",
    "js": [ "scripts/content/shortcuts.js",
            "scripts/content/lookup.js"],
    "matches": ["http://devdocs.io/*"]
  }
];

function injectScripts () {
  popupOnlyContentScripts.forEach(
    contentScriptBlock =>
      contentScriptBlock.js.forEach(
        scriptFile =>
          bgGlobal.addMsgEventListener('bg.popup.load', function injectSingleScript () {
            chrome.tabs.executeScript(bgGlobal.popup.tabId, {
              runAt: contentScriptBlock.run_at,
              file: scriptFile,
            });
          })
      )
  );
}

injectScripts();
