'use strict';

// * About shortcuts management
//
// 1. The UI can be in two states: list and content.
//
// 2. Some keys' default action relies on focus on the proper elements to
// function, and thus we need to manage focus as well.
//
// 3. Some conventions: in list view, when an entry is given a 'focus' class
// it's *highlighted*. When the focus of the page is given to some element, it's
// *focused*. When user *choose*/click on an entry it's *chosen*.
//
// 4. element visibility: entry can be visible or scrolled to.

// refs to common ui components
var uiRefs = {};

uiRefs.header = $('._header');
uiRefs.headerRect = uiRefs.header.getBoundingClientRect();
uiRefs.searchInput = $('._search-input');
uiRefs.sidebar = $('._sidebar');
// $('._sidebar > ._list') gets regenerated with each search, not appropriate
// for persistent reference.
uiRefs.list = null;
uiRefs.content = $('._content');
// make content focusable (we can use document.activeElement for verification)
// ref: http://stackoverflow.com/a/3656524/2526378
uiRefs.content.setAttribute('tabindex', 0);

// Test whether an entry is still visible
// ref: http://stackoverflow.com/a/7557433/2526378
function isEntryVisible (el) {
  var rect = el.getBoundingClientRect();

  return (rect.top >= uiRefs.headerRect.bottom // not hidden by header bar
          && rect.left >= 0
          && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
          && rect.right <= (window.innerWidth || document.documentElement.clientWidth));
}


// @param: entry, allow null, then this function doesn't do anything
function hlEntry (entry) {
  if (entry === null) {
    return;
  }

  const curEntry = $('._list .focus');

  if (curEntry) {
    curEntry.classList.remove('focus');
  }

  entry.classList.add('focus');
}

function hlNextAndScrollTo () {
  var nextEntry = $('._list .focus').nextSibling;

  hlEntry(nextEntry);

  if (nextEntry && !isEntryVisible(nextEntry)) {
    nextEntry.scrollIntoView(false);
  }
}

function hlPrevAndScrollTo () {
  var prevEntry = $('._list .focus').previousSibling;

  hlEntry(prevEntry);

  if (prevEntry && !isEntryVisible(prevEntry)) {
    prevEntry.scrollIntoView(true);
  }
}

function hlFirstVisible () {
  var entryList = $All('._list a');
  for (let i = 0; i < entryList.length; i++) {
    const entry = entryList[i];

    if ( isEntryVisible(entry) ) {
      hlEntry(entry);

      return;
    }
  }
}

function hlLastVisible () {
  var entryList = $All('._list a');
  for (let i = entryList.length - 1; i >= 0; i--) {
    const entry = entryList[i];

    if ( isEntryVisible(entry) ) {
      hlEntry(entry);

      return;
    }
  }
}

function hlFirst () {
  if ($('._list .focus')) {
    return;
  }

  const firstCandidate = $('._list :first-child');

  hlEntry(firstCandidate);
}

function currentView () {
  if ( uiRefs.sidebar.style.display === 'none' ) {
    return 'content';
  }

  return 'list';
}

function focusHLEntry () {
  uiRefs.searchInput.blur();
  $('._list .focus').focus();
}

function focusContent () {
  uiRefs.searchInput.blur();
  uiRefs.content.focus();
}

function focusSearchInput () {
  uiRefs.searchInput.focus();
}

function toggleListContentView () {
  // todo call function to switch directly
  $('a._menu-link').click();

  // manage focus
  if (currentView() === 'list') {
    focusHLEntry();
  } else {
    focusContent();
  }
}

function chooseHL () {
  var curHLEntry = $('._list .focus');

  if (curHLEntry) {
    // todo patch up entry on active entry
    if (curHLEntry.classList.contains('active')) {
      toggleListContentView();

      return;
    }

    curHLEntry.click();
    focusContent();
  }
}
// todo an upstream problem: in mobile view, click on active entry should still jump to content
uiRefs.sidebar.addEventListener('click', function patchUpActiveEntryBehavior (e) {
  if (e.target.classList.contains('active')) {
    toggleListContentView();
  }
});

// todo: remove setTimeout for various key events due to timing issues.
uiRefs.searchInput.addEventListener('input', function searchInputCB () {
  // Hide notice bar that informs the user some documentation is not enabled.
  var noticeBar = $('._notice');
  if (noticeBar) {
    noticeBar.style.display = "none";
  }

  setTimeout(hlFirst, 200);
});

function isTypingKey (keyCode) {
  return ((keyCode === 8)       // backspace
          || (keyCode === 27)      // esc
          || (keyCode === 190)  // '.'
          || (keyCode === 186)  // ':'
          // alphanumeric keys
          || (48 <= keyCode && keyCode <= 57)
          || (65 <= keyCode && keyCode <= 90));
}

function handleListNavControls (keyEvent) {
  focusHLEntry();

  switch (keyEvent.which) {
  case 38:                      // up
    hlPrevAndScrollTo();
    // do NOT move scrollbar
    keyEvent.preventDefault();
    break;
  case 40:                      // down
    hlNextAndScrollTo();
    keyEvent.preventDefault();
    break;
    // enter can now toggle list and content view
  case 13:                      // enter
    chooseHL();
    break;
  case 33:                      // page up
    setTimeout(hlFirstVisible, 100);
    break;
  case 34:                      // page down
    setTimeout(hlLastVisible, 100);
    break;
  default:
    // console.log('List-Nav, unhandled key: ' + keyEvent.which);
    focusSearchInput();
    return;
  }
}

function handleContentNavControls (keyEvent) {
  // keys that we rely on their default actions given the focus is correct.
  // up/down arrows, page up/down, space (scroll down)
  var defaultNavKeys = [38, 40, 33, 34, 32];

  focusContent();

  if (defaultNavKeys.indexOf(keyEvent.which) > -1) {
    return;
  }

  switch (keyEvent.which) {
    // enter can now toggle list and content view
  case 13:                      // enter
    toggleListContentView();
    break;
  default:
    // console.log('Content-Nav, unhandled key: ' + keyEvent.which);
    focusSearchInput();
  }
}

function handleNavControls (keyEvent) {
  // Control keys for easy navigation
  // ref: http://stackoverflow.com/a/4866269/2526378
  //
  // NOTE: all sub handlers should keep focus in search input if keys are not
  // handled.
  if ( currentView() === 'list' ) {
    handleListNavControls(keyEvent);
  } else {
    handleContentNavControls(keyEvent);
  }
}

window.onkeydown = function keyDownCB (e) {
  // use form attribute to check whether the focus is in the input
  var isInputFocused = e.target.form;
  var keyCode = e.which;

  // * Auto-Typing
  //
  // backspace and most alphanumeric keys are considered typing keys
  // they immediately re-focus the input box whatever the current views
  if (isTypingKey(keyCode)) {
    // todo maybe an option for erase the content? for now no erase
    if (!isInputFocused) {
      focusSearchInput();
    }

    return;
  }

  // * Navigation controls
  handleNavControls(e);
};

// Give mouse visual feedback
// NOTE: ._list is NOT available
uiRefs.sidebar
  .addEventListener('mousedown', function sidebarMousedownCB (e) {
    var entry = e.target;

    if (currentView() !== 'list'
        || !entry.classList.contains('_list-item')) {
      return;
    }

    hlEntry(entry);
  });
