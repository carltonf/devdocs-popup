// ref: http://stackoverflow.com/a/7557433/2526378
function isElementInViewport (el) {
    var rect = el.getBoundingClientRect();

    return (rect.top >= 0
            && rect.left >= 0
            && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
            && rect.right <= (window.innerWidth || document.documentElement.clientWidth));
}

var searchInput = document.querySelector('._search-input'),
    candidatesList = document.querySelector('._sidebar > ._list');

// @param: entry, allow null, then this function doesn't do anything
function focusThisEntry (entry){
  'use strict';

  if(entry === null)
    return;

  let curEntry = document.querySelector('._list .focus');

  if (curEntry){
    curEntry.classList.remove('focus');
  }

  entry.classList.add('focus');
}

function focusNext(){
  var nextEntry = document.querySelector('._list .focus').nextSibling;

  focusThisEntry(nextEntry);
}

function focusPrev(){
  var prevEntry = document.querySelector('._list .focus').previousSibling;

  focusThisEntry(nextEntry);
}

function focusFirstVisible(){
  'use strict';

  var curFocused = document.querySelector('._list .focus');

  if ( isElementInViewport(curFocused) ){
    return;
  }

  for(let entry in document.querySelectorsAll('._list a')){
    if( isElementInViewport(entry) ){
      focusThisEntry(entry);

      return;
    }
  }
}

function focusFirst(){
  'use strict';

  if (document.querySelector('._list .focus')){
    return;
  }

  let firstCandidate = document.querySelector('._list :first-child');

  focusThisEntry(firstCandidate);
}

function chooseCurFocused(){
    document.querySelector('._list .focus').click();
}

window.onkeydown = function(e){
  'use strict';

  var keyCode = e.which;
  if ((48 <= keyCode && keyCode <= 57)
      || (65 <= keyCode && keyCode <= 90)){
    // HACK: It's too early to focus the first here,
    // we need to wait for search results loaded
    setTimeout(function(){
      focusFirst();
    }, 200);

    return;
  }

  switch(e.which){
  case 38:  // up
    focusPrev();
    break;
  case 40:  // down
    focusNext();
    break;
  case 13:
    chooseCurFocused();
    break;
    // todo: use space key to switch
  case 18: // alt key to toggle between list and content
    document.querySelector('a._menu-link').click();
    break;
  default:
    console.log('Unhandled: ' + e.which);
  }
};

// Give mouse visual feedback
// NOTE: ._list is NOT available
document.querySelector('._sidebar').addEventListener('mousedown', function(e){
  var entry = e.target,
      entryListNode = document.querySelector('._list');

  if (!entryListNode) return;
  if (entry.parentNode !== entryListNode) return;

  focusThisEntry(entry);
});
