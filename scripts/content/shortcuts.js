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
  var curhlEntry = $('._list .focus');

  if (!curhlEntry) {
    return;
  }

  uiRefs.searchInput.blur();
  curhlEntry.focus();
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
  }
}

// todo an upstream problem: in mobile view, click on active entry should still jump to content
// this is a hacky solution
uiRefs.sidebar.addEventListener('click', function patchUpActiveEntryBehavior (e) {
  var entry = e.target;

  if (entry.classList.contains('active')
      && (entry.getAttribute('href') === window.location.pathname)) {
    toggleListContentView();
  }
});

// TODO: remove setTimeout for various key events due to timing issues.
// MutationObserver might be a good option
uiRefs.searchInput.addEventListener('input', function searchInputCB () {
  // Hide notice bar that informs the user some documentation is not enabled.
  var noticeBar = $('._notice');
  if (noticeBar) {
    noticeBar.style.display = "none";
  }

  setTimeout(hlFirst, 50);
});

// TODO split key map into separate modules
const listNavKeyActionMap = {
  '38': function listNavUp (keyEvent) {
    hlPrevAndScrollTo();
    // do NOT move scrollbar
    keyEvent.preventDefault();
  },
  '40': function listNavDown (keyEvent) {
    hlNextAndScrollTo();
    keyEvent.preventDefault();
  },
  '13': function listNavEnter () {
    chooseHL();
  },
  '33': function listNavPageUp () {
    setTimeout(hlFirstVisible, 100);
  },
  '34': function listNavPageDown () {
    setTimeout(hlLastVisible, 100);
  }
};
function handleListNavControls (keyEvent) {
  var keyAction = listNavKeyActionMap[keyEvent.which];

  if (keyAction) {
    focusHLEntry();
    keyAction(keyEvent);
    return true;
  }

  // console.log('List-Nav, unhandled key: ' + keyEvent.which);
  return false;
}

function handleContentNavControls (keyEvent) {
  // keys that we rely on their default actions given the focus is correct.
  var defaultNavKeys = [
    36, 35,                     // home/end
    38, 40,                     // up/down
    33, 34,                     // page up/down
    32                          // space (scroll down)
  ];
  var keyCode = keyEvent.which;
  var isKeyHandled = (defaultNavKeys.indexOf(keyEvent.which) > -1)
        || (keyCode === 13);

  if (isKeyHandled) {
    focusContent();

    switch (keyCode) {
    case 13:                      // enter
      toggleListContentView();
      break;
    default:
    }

    return true;
  }

  // console.log('Content-Nav, unhandled key: ' + keyEvent.which);
  return false;
}

function handleNavControls (keyEvent) {
  // Control keys for easy navigation
  // ref: http://stackoverflow.com/a/4866269/2526378
  //
  // NOTE: all sub handlers should keep focus in search input if keys are not
  // handled.
  if ( currentView() === 'list' ) {
    return handleListNavControls(keyEvent);
  } else if (currentView() === 'content') {
    return handleContentNavControls(keyEvent);
  }

  return false;
}

function handleTypingKeys (keyEvent) {
  // use form attribute to check whether the focus is in the input
  var isInputFocused = keyEvent.target.form;
  var keyCode = keyEvent.which;
  // *unmodified* backspace and most alphanumeric keys are considered auto
  // typing keys, they immediately re-focus the input box whatever the current
  // view
  var isAutoTypingKey =
        (!keyEvent.altKey && !keyEvent.ctrlKey)
        && ((keyCode === 8)       // backspace
            || (keyCode === 190)  // '.'
            || (keyCode === 186)  // ':'
            // alphanumeric keys
            || (48 <= keyCode && keyCode <= 57)
            || (65 <= keyCode && keyCode <= 90));
  var isEscKey = (keyCode === 27);
  var isKeyHandled = (isAutoTypingKey || isEscKey);

  if (isInputFocused) {
    // keys like: home/end have common meanings in input box: handle them, so
    // users are not confused.
    if (keyCode === 36 || keyCode === 35) {
      return true;
    }
  } else {
    // input is NOT focused
    if (isAutoTypingKey) {
      focusSearchInput();
    }

    if (isEscKey) {
      // Esc is special auto typing keys: it not only refocuses input box but also
      // select all text.
      uiRefs.searchInput.select();
    }
    // todo esc on empty input to minimize the popup?

    return isKeyHandled;
  }
}

window.onkeydown = function keyHandlersController (e) {
  var keyCode = e.which;

  // NOTE: "keyEvent.keyIdentifier" has more human-readable name
  var isOnlyControlKeys =
        (keyCode === '17' // control
         || keyCode === '18' // alt
        );

  // NOTE: all key handlers should return boolean values, true if the key is
  // handled, false if not.
  // TODO: handleTypingKeys be merged with handleUnhandledKeys?
  var keyHandlers = [
    handleTypingKeys,
    handleNavControls,
  ];

  if (isOnlyControlKeys) {
    return;
  }

  keyHandlers.some(function keyHandlerRunner (handler) {
    return handler(e);
  });
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
