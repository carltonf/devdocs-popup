/*global chrome */

var devdocsPopupWin = null;

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

    devdocsPopupWin = win;
  });
}

function switchToPopupWin() {
  'use strict';

  var updateInfo = {
    focused: true
  };

  chrome.windows.update(devdocsPopupWin.id, updateInfo);
}

chrome.browserAction.onClicked.addListener(function (tab) {
  'use strict';

  if (devdocsPopupWin) {
    switchToPopupWin();
  } else {
    createPopupWin();
  }

});

chrome.windows.onRemoved.addListener(function (winId) {
  'use strict';

  if (devdocsPopupWin && (winId === devdocsPopupWin.id)) {
    devdocsPopupWin = null;
  }
});

// Communicate with content script
chrome.runtime.onMessage.addListener(function (msg, sender, sendRes) {
  'use strict';

  switch (msg.command) {
  case "checkCurWinIsPopupWin":
    if(devdocsPopupWin === null){
      sendRes({
        result: false
      });
    } else {
      // TODO: devdocsPopupWin.focused will always return true, this might be that
      // devdocsPopupWin is only a copy its state will get stale. We should only store
      // devdocsPopupWinId
      chrome.windows.get(devdocsPopupWin.id, popup => {
        sendRes({
          result: popup.focused
        });
      });

      return true;
    }
    break;
  default:
  }
});
