// Initialization for content scripts at 'document_start'

window.addEventListener('load', function onceNotifyBGReady () {
  chrome.runtime.sendMessage({
    "command": "notify-window.onload"
  });

  window.removeEventListener(onceNotifyBGReady);
});
