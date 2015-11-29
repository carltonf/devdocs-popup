// NOTE: chrome.windows.Window object is stored through copy, so its state will
// get stale. For example, storedWin.focused will always return true.
//
// We should only store window Id.

function createPopupWin () {
  var createData = {
    url: "http://devdocs.io",
    width: 650,
    height: 900,
    // Popup type will leave all browser chrome out
    type: 'popup',
  };

  var createPopupProimse = new Promise(function createPopupPromiseExecutor (resolve) {
    chrome.windows.create(createData, function createPopupWinAsyncCB (win) {
      bgGlobal.popup.winId = win.id;
      bgGlobal.popup.tabId = win.tabs[0].id;

      bgGlobal.dispatchMsgEvent('bg.popup.load');

      resolve(null);
    });
  });

  return createPopupProimse;
}

function switchToPopupWin () {
  var updateInfo = {
    focused: true
  };

  chrome.windows.update(bgGlobal.popup.winId, updateInfo);
}

function hidePopupWin () {
  var updateInfo = {
    state: 'minimized'
  };

  chrome.windows.update(bgGlobal.popup.winId, updateInfo);
}


function togglePopupWin () {
  if (bgGlobal.popup.winId) {
    chrome.windows.get(bgGlobal.popup.winId, function togglePopupWinAsyncCB (popup) {
      if (!popup) {
        return;
      }

      if (popup.focused) {
        hidePopupWin();
      } else {
        switchToPopupWin();
      }
    });
  } else {
    createPopupWin().then(null);
  }
}

chrome.browserAction.onClicked.addListener(function browserActionOnClickCB () {
  togglePopupWin();
});

chrome.windows.onRemoved.addListener(function popupOnRemovedCB (winId) {
  if (winId === bgGlobal.popup.winId) {
    bgGlobal.popup.winId = null;
  }
});

// what to do when the shortcut doesn't work
// ref: http://stackoverflow.com/a/20747101
chrome.commands.onCommand.addListener(function chromeCmdHandler (cmd) {
  switch (cmd) {
  case "toggle-popup":
    togglePopupWin();
    break;
  default:
  }
});

// Context Menu
//
// TODO About selection search when the popup window is NOT opened.
//
// Simply, it doesn't work. To implement such feature, the timing for background
// and content needs to be well synced. For now, I'll use a workaround to warn
// the user about this fact instead of silent failure.
function searchSelectionInPopup (info) {
  var searchStr = info.selectionText;

  function sendSearchStr () {
    chrome.tabs.sendMessage(bgGlobal.popup.tabId, {
      command: 'search',
      str: searchStr,
    });
  }

  if (bgGlobal.popup.winId) {
    switchToPopupWin();

    sendSearchStr();
  } else {
    createPopupWin().then();

    chrome.runtime.onMessage.addListener(function delayedSearchSelectionAfterLoad (msg) {
      if (msg.command !== 'notify-window.onload') {
        return;
      }

      sendSearchStr();
    });
  }
}
function createContextMenuEntry () {
  var contextMenuEntryCreateProps = {
    id: "searchTheSelectionEntry",
    type: 'normal',
    title: 'Search devdocs.io for "%s"',
    contexts: ['selection'],
    onclick: searchSelectionInPopup,
  };

  chrome.contextMenus.create(contextMenuEntryCreateProps);
}

createContextMenuEntry();
