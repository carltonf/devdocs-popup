// NOTE: chrome.windows.Window object is stored through copy, so its state will
// get stale. For example, storedWin.focused will always return true.
//
// We should only store window Id.

var devdocsPopupId = null;

function createPopupWin () {
  var createData = {
    url: "http://devdocs.io",
    width: 600,
    height: 900,
    // Popup type will leave all browser chrome out
    type: 'popup'
  };

  chrome.windows.create(createData, function createPopupWinAsyncCB (win) {
    devdocsPopupId = win.id;
  });
}

function switchToPopupWin () {
  var updateInfo = {
    focused: true
  };

  chrome.windows.update(devdocsPopupId, updateInfo);
}

function hidePopupWin () {
  var updateInfo = {
    state: 'minimized'
  };

  chrome.windows.update(devdocsPopupId, updateInfo);
}


function togglePopupWin () {
  if (devdocsPopupId) {
    chrome.windows.get(devdocsPopupId, function togglePopupWinAsyncCB (popup) {
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
    createPopupWin();
  }
}

chrome.browserAction.onClicked.addListener(function browserActionOnClickCB () {
  togglePopupWin();
});

chrome.windows.onRemoved.addListener(function popupOnRemovedCB (winId) {
  if (winId === devdocsPopupId) {
    devdocsPopupId = null;
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
    if (devdocsPopupId === null) {
      sendRes({
        result: false
      });
    } else {
      chrome.windows.get(devdocsPopupId, function getPopupAndSendRes (popup) {
        sendRes({
          result: (popup && popup.focused)
        });
      });

      return true;
    }
    break;
  default:
  }
});

// Context Menu
function searchTextInPopup (info) {
  var searchStr = info.selectionText;
  if (devdocsPopupId) {
    switchToPopupWin();
  } else {
    createPopupWin();
  }
  // TODO store tabId when the window is created
  //
  // TODO if the popup window has NOT been created, the following query returns
  // nothing.
  chrome.tabs.query({windowId: devdocsPopupId}, function queryPopupWinTabCB (tabs) {
    var popupWinTabId = tabs[0].id;

    chrome.tabs.sendMessage(popupWinTabId, {
      command: 'search',
      str: searchStr,
    });
  });
}
function createContextMenuEntry () {
  var contextMenuEntryCreateProps = {
    type: 'normal',
    title: 'Search in Devdocs Popup for "selected text"...',
    contexts: ['selection'],
    onclick: searchTextInPopup,
  };

  chrome.contextMenus.create(contextMenuEntryCreateProps);
}

createContextMenuEntry();
