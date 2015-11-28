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
