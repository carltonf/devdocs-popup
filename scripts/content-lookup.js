'use strict';

var searchInput = document.querySelector('._search-input');

function setInputAndSearch (searchStr) {
  // programatically trigger input event
  // ref: https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events#Triggering_built-in_events
  var inputEvt = new UIEvent('input', {view: window,
                                  bubbles: true,
                                  cancelable: true});

  searchInput.value = searchStr;
  searchInput.focus();
  searchInput.dispatchEvent(inputEvt);
}

chrome.runtime.onMessage.addListener(function chromeMsgHandlerInContent (msg) {
  switch (msg.command) {
  case 'search':
    setInputAndSearch(msg.str);
    break;
  default:
  }
});
