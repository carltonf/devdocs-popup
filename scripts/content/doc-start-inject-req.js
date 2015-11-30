// script enlisted in manifest to send message tell background to inject other
// content scripts: a workaround for injecting scripts when refreshing
chrome.runtime.sendMessage({
  "command": "notify.document_start"
});
