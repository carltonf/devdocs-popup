function changeUAInPage () {
  // ref: http://stackoverflow.com/a/23456845/2526378
  // Trick to change the navigator.userAgent from JS side
  //
  // Ref: https://github.com/Thibaut/devdocs/blob/de1c8797301253f6a1e2cba11273f93af5f44f9c/assets/javascripts/app/app.coffee#L220
  // The easy way to trick devdocs to display mobile version is through changing userAgent.
  //
  // NOTE: As HTML5 offline app, there is no webRequest sent, so the
  // chrome.webRequest doesn't help.
  //
  // TODO suggests devdocs to have an option or URL params to force mobile version
  var injectCode = '(' + function injectCodeFunc () {
    var navigator = window.navigator;
    var modifiedNavigator = null;

    if (Navigator.prototype.hasOwnProperty('userAgent')) {
      // Chrome 43+ moved all properties from navigator to the prototype,
      // so we have to modify the prototype instead of navigator.
      modifiedNavigator = Navigator.prototype;
    } else {
      // Chrome 42- defined the property on navigator.
      modifiedNavigator = Object.create(navigator);
      Object.defineProperty(window, 'navigator', {
        value: modifiedNavigator,
        configurable: false,
        enumerable: false,
        writable: false
      });
    }
    // Pretend to be Windows XP
    Object.defineProperties(modifiedNavigator, {
      userAgent: {
        value: "Android Mobile",
        configurable: false,
        enumerable: true,
        writable: false
      }
    });
  } + ')();';

  document.documentElement.setAttribute('onreset', injectCode);
  document.documentElement.dispatchEvent(new CustomEvent('reset'));
  document.documentElement.removeAttribute('onreset');
}


// Only change UA for the popup devdocs
//
// NOTE: programatic injection relies on messaging or async event, we can't
// guarantee the timing of changeUAInPage invocation. The timing of change UA is
// too important, so have this script executed at the first chance and minimize
// all possible delays. For now, the only async delay is to check whether this
// tab is popup tab.
//
// TODO fake UA to have mobile view on desktop is too hacky, try to push this UI
// mode to upstream.
chrome.runtime.sendMessage({
  "command": "cmd.query.isPopup"
}, function cmdQueryIsPoupResCB (res) {
  if (res === undefined) {
    console.error("Can't check current window is Popup window.");
    return false;
  } else if (res.result === true) {
    changeUAInPage();
  }
});
