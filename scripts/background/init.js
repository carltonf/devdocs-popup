// Initialize global and various utilities for other backgournd scripts

window.bgGlobal = {
  popup: {
    winId: null,
    tabId: null,
  },

  // * Mini Event System for Background: MsgEvent
  //
  // Use chrome.runtime messages as event bus
  // 1. all msgEvent should prevfixed with "bg."
  // 2. no response will be sent and response handler won't be set
  addMsgEventListener: function bgGlobalAddMsgEventListener (msgEvent, cb) {
    chrome.runtime.onMessage.addListener(function bgInternalMsgEventHandler (msg) {
      if ( msg.event !== msgEvent ) {
        return;
      }

      cb();
    });
  },

  dispatchMsgEvent: function bgGlobalDispatchMsgEvent (msgEvent) {
    chrome.runtime.sendMessage({
      event: msgEvent
    });
  },
};
