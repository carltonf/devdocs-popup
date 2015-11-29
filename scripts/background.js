// NOTE: chrome.windows.Window object is stored through copy, so its state will
// get stale. For example, storedWin.focused will always return true.
//
// We should only store window Id.

var popupWinId = null;
var popupTabId = null;

function createPopupWin () {
  var createData = {
    url: "http://devdocs.io",
    width: 600,
    height: 900,
    // Popup type will leave all browser chrome out
    type: 'popup',
  };

  var createPopupProimse = new Promise(function createPopupPromiseExecutor (resolve) {
    chrome.windows.create(createData, function createPopupWinAsyncCB (win) {
      popupWinId = win.id;
      popupTabId = win.tabs[0].id;

      resolve(null);
    });
  });

  return createPopupProimse;
}

function switchToPopupWin () {
  var updateInfo = {
    focused: true
  };

  chrome.windows.update(popupWinId, updateInfo);
}

function hidePopupWin () {
  var updateInfo = {
    state: 'minimized'
  };

  chrome.windows.update(popupWinId, updateInfo);
}


function togglePopupWin () {
  if (popupWinId) {
    chrome.windows.get(popupWinId, function togglePopupWinAsyncCB (popup) {
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
  if (winId === popupWinId) {
    popupWinId = null;
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

// Communicate with content script
chrome.runtime.onMessage.addListener(function chromeMsgHandler (msg, sender, sendRes) {
  switch (msg.command) {
  case 'checkCurWinIsPopupWin':
    sendRes({
      result: (popupWinId === sender.tab.windowId)
    });
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
  if (popupWinId) {
    switchToPopupWin();
  } else {
    createPopupWin().then(hidePopupWin);
  }

  chrome.tabs.sendMessage(popupTabId, {
    command: 'search',
    str: searchStr,
  });

  // NOTE: A temporary workaround for the case when popup window has not been
  // created yet.
  if (!popupWinId) {
    chrome.contextMenus.update("searchTheSelectionEntry", {
      title: 'Search devdocs.io for "%s"',
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

  if (!popupWinId) {
    contextMenuEntryCreateProps.title = 'Open devdocs Popup first for selection search';
  }

  chrome.contextMenus.create(contextMenuEntryCreateProps);
}

createContextMenuEntry();
