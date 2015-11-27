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

  if (winId === devdocsPopupWin.id) {
    devdocsPopupWin = null;
  }
});
