'use strict';

const headerNav = document.querySelector('._header');
var headerNavRect = headerNav.getBoundingClientRect();
var searchInput = document.querySelector('._search-input');
var candidatesList = document.querySelector('._sidebar > ._list');

// Test whether an entry is still visible
// ref: http://stackoverflow.com/a/7557433/2526378
function isEntryVisible (el) {
  var rect = el.getBoundingClientRect();

  return (rect.top >= headerNavRect.bottom // not hidden by header bar
          && rect.left >= 0
          && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
          && rect.right <= (window.innerWidth || document.documentElement.clientWidth));
}


// @param: entry, allow null, then this function doesn't do anything
function focusThisEntry (entry) {
  if (entry === null) {
    return;
  }

  const curEntry = document.querySelector('._list .focus');

  if (curEntry) {
    curEntry.classList.remove('focus');
  }

  entry.classList.add('focus');
}

function focusNext () {
  var nextEntry = document.querySelector('._list .focus').nextSibling;

  focusThisEntry(nextEntry);

  if(nextEntry && !isEntryVisible(nextEntry)){
    // nextEntry.focus();
    nextEntry.scrollIntoView(false);
  }
}

function focusPrev () {
  var prevEntry = document.querySelector('._list .focus').previousSibling;

  focusThisEntry(prevEntry);
  if(prevEntry && !isEntryVisible(prevEntry)){
    // prevEntry.focus();
    prevEntry.scrollIntoView(true);
  }
}

function focusFirstVisible () {
  var entryList = document.querySelectorAll('._list a');
  for (let i = 0; i < entryList.length; i++) {
    const entry = entryList[i];

    if ( isEntryVisible(entry) ) {
      focusThisEntry(entry);

      return;
    }
  }
}

function focusLastVisible () {
  var entryList = document.querySelectorAll('._list a');
  for (let i = entryList.length - 1; i >= 0; i--) {
    const entry = entryList[i];

    if ( isEntryVisible(entry) ) {
      focusThisEntry(entry);

      return;
    }
  }
}

function focusFirst () {
  if (document.querySelector('._list .focus')) {
    return;
  }

  const firstCandidate = document.querySelector('._list :first-child');

  focusThisEntry(firstCandidate);
}

function chooseCurFocused () {
  var curFocusedEntry = document.querySelector('._list .focus');

  if (curFocusedEntry) {
    // accidentally the following check toggle list and content view
    if (curFocusedEntry.classList.contains('active')){
      // todo an upstream problem: in mobile view, click on active entry should still
      // jump to content
      document.querySelector('a._menu-link').click();

      return;
    }
    curFocusedEntry.click();
    searchInput.blur();
  }
}
// todo the same patchup active entry action
document.querySelector('._sidebar').addEventListener('click', function patchUpActiveEntryBehavior (e){
  if (e.target.classList.contains('active')){
    document.querySelector('a._menu-link').click();
  }
});

// HACK: I've used setTimeout for various key events due to various timing
// issues.
searchInput.addEventListener('input', function searchInputCB () {
  // Hide notice bar that informs the user some documentation is not enabled.
  var noticeBar = document.querySelector('._notice');
  if (noticeBar) {
    noticeBar.style.display = "none";
  }

  setTimeout(focusFirst, 200);
});

function isTypingKey (keyCode) {
  return ((keyCode === 8)       // backspace
          || (keyCode === 190)  // '.'
          || (keyCode === 186)  // ':'
          // ascii code
          || (48 <= keyCode && keyCode <= 57)
          || (65 <= keyCode && keyCode <= 90));
}

function handleCandidatesListNavigationControls (keyEvent) {
  searchInput.blur();
  document.querySelector('._list .focus').focus();

  switch (keyEvent.which) {
  case 38:                      // up
    focusPrev();
    keyEvent.preventDefault();
    break;
  case 40:                      // down
    focusNext();
    keyEvent.preventDefault();
    break;
    // enter can now toggle list and content view
  case 13:                      // enter
    chooseCurFocused();
    break;
  case 33:                      // page up
    setTimeout(focusFirstVisible, 100);
    break;
  case 34:                      // page down
    setTimeout(focusLastVisible, 100);
    break;
  default:
    console.log('List-Nav, unhandled key: ' + keyEvent.which);
    return;
  }
}

function handleContentNavControls (keyEvent) {
  searchInput.blur();
  document.querySelector('._container').focus();

  switch (keyEvent.which) {
    // enter can now toggle list and content view
  case 13:                      // enter
    chooseCurFocused();
    break;
  default:
    console.log('Content-Nav, unhandled key: ' + keyEvent.which);
    return;
  }
}

window.onkeydown = function keyDownCB (e) {
  // use form attribute to check whether the typing is in the input
  var isInputFocused = e.target.form;
  var keyCode = e.which;

  // typing to immediately re-focus the input box
  if (isTypingKey(keyCode)) {
    //if (keyCode !== 8) {
    //  // Erase the content as well unless it's backspace
    //  searchInput.value = '';
    //}
    if(!isInputFocused){
      searchInput.focus();
    }

    return;
  }

  // Control keys for easy navigation
  // ref: http://stackoverflow.com/a/4866269/2526378
  if ( document.querySelector('._sidebar').style.display === 'none' ) {
    handleContentNavControls(e);
  } else {
    handleCandidatesListNavigationControls(e);
  }
};

// Give mouse visual feedback
// NOTE: ._list is NOT available
document.querySelector('._sidebar')
  .addEventListener('mousedown', function sidebarMousedownCB (e) {
    var entry = e.target;
    var entryListNode = document.querySelector('._list');

    if (!entryListNode) return;
    if (entry.parentNode !== entryListNode) return;

    focusThisEntry(entry);
  });
