'use strict';

// Same format as "content_scripts" in manifest.json
//
// NOTE: Field "matches" is kept for easy code movement between injection and
// manifest. It's NOT used here.
var popupOnlyContentScripts = [
  {
    "run_at": "document_start",
    "js": [ "scripts/content/doc-start-init.js" ],
    "matches": ["http://devdocs.io/*"]
  },
  {
    "run_at": "document_end",
    "js": [ "scripts/content/shortcuts.js",
            "scripts/content/lookup.js"],
    "matches": ["http://devdocs.io/*"]
  }
];

var popupOnlyStyles = [
  {
    "matches": ["http://devdocs.io/*"],
    "css": ["styles/mobile-desktopify.css"]
  }
];

function injectCB () {
  // a dummy handler just try to capture errors
  if (chrome.runtime.lastError) {
    const errorMsg = chrome.runtime.lastError.message;
    if (errorMsg.indexOf('No tab with id') > -1) {
      // ignore missing tab id error, it usually only happens when we are
      // testing: we close the window too quick before the injections.
      return;
    }

    // or rethrow the error?
    console.error(errorMsg);
  }
}

function injectStyles () {
  popupOnlyStyles.forEach(
    contentStyleBlock =>
      contentStyleBlock.css.forEach(
        styleFile => chrome.tabs.insertCSS(bgGlobal.popup.tabId, {
          file: styleFile
        }, injectCB)
      )
  );
}

function injectScripts () {
  popupOnlyContentScripts.forEach(
    contentScriptBlock =>
      contentScriptBlock.js.forEach(
        scriptFile => chrome.tabs.executeScript(bgGlobal.popup.tabId, {
          runAt: contentScriptBlock.run_at,
          file: scriptFile,
        }, injectCB)
      )
  );
}

chrome.runtime.onMessage.addListener(function injectScriptsAsContentRequests (msg) {
  if (msg.command !== 'notify.document_start') {
    return;
  }

  injectStyles();
  injectScripts();
});
