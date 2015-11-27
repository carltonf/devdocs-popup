/*global chrome */

// NOTE: chrome.windows.Window object is stored through copy, so its state will
// get stale. For example, storedWin.focused will always return true.
//
// We should only store window Id.
var devdocsPopupId = null;

function createPopupWin() {
  'use strict';

  var createData = {
    url: "http://devdocs.io",
    width: 600,
    height: 900,
    // Popup type will leave all browser chrome out
    type: 'popup'
  };

  chrome.windows.create(createData, function (win) {

    devdocsPopupId = win.id;
  });
}

function switchToPopupWin() {
  'use strict';

  var updateInfo = {
    focused: true
  };

  chrome.windows.update(devdocsPopupId, updateInfo);
}

function hidePopupWin() {
  'use strict';

  var updateInfo = {
    state: 'minimized'
  };

  chrome.windows.update(devdocsPopupId, updateInfo);
}


function togglePopupWin() {
  'use strict';

  if (devdocsPopupId) {

    chrome.windows.get(devdocsPopupId, function (popup) {
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

chrome.browserAction.onClicked.addListener(function (tab) {
  'use strict';
  togglePopupWin();
});

chrome.windows.onRemoved.addListener(function (winId) {
  'use strict';

  if (winId === devdocsPopupId) {
    devdocsPopupId = null;
  }
});

chrome.commands.onCommand.addListener(function (cmd) {
  'use strict';

  switch (cmd) {
  case "toggle-popup":
    togglePopupWin();
    break;
  }
});

// Communicate with content script
chrome.runtime.onMessage.addListener(function (msg, sender, sendRes) {
  'use strict';

  switch (msg.command) {
  case "checkCurWinIsPopupWin":
    if (devdocsPopupId === null) {
      sendRes({
        result: false
      });
    } else {
      chrome.windows.get(devdocsPopupId, function (popup) {
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
