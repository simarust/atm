chrome.runtime.onMessage.addListener(async request => {
  if (request.message == 'highlightTask') {
    chrome.storage.sync.get("highlighting", ({ highlighting }) => {
      if (highlighting) {
        const taskId = request.taskId
        var xpath = `//div[text()='${taskId}']//ancestor::div[@class="tbTileContent"]`;
        const tile = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        tile.style.backgroundColor = 'crimson'
      }
    })
  }
})

window.addEventListener('load', () => {
    chrome.runtime.sendMessage({
      'message': 'updateContextMenu',
      'currentPage': document.location.href
    })
}, true)
