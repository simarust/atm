window.addEventListener('load', function(event) {
    chrome.runtime.sendMessage({
      'message': 'updateContextMenu',
      'currentPage': document.location.href
    })
}, true)