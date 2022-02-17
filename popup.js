function addListItem(taskName, taskId) {
  const list = document.getElementById("taskList")
  const newEntry = document.createElement("li")
  newEntry.setAttribute("id", taskId)
  newEntry.addEventListener("click", removeListItem)
  const textNode = document.createTextNode(taskName)

  newEntry.appendChild(textNode)
  list.appendChild(newEntry)
}

function removeListItem(event) {
  var idToRemove = event.target.id
  chrome.storage.sync.get("tasks", ({ tasks }) => {
    tasks = tasks.filter(task => task.id != idToRemove)
    chrome.storage.sync.set({ tasks })
  })
  const listItem = document.getElementById(idToRemove)
  listItem.remove()
}

function addTask() {
  const taskInput = document.getElementById("taskInput")
  const newTaskName = taskInput.value
  if (newTaskName) {
    const id = Date.now()
    addListItem(newTaskName, id)
    chrome.storage.sync.get("tasks", ({ tasks }) => {
      if (!tasks) tasks = []
      tasks.push({ id, name: newTaskName})
      chrome.storage.sync.set({ tasks })
    })
    taskInput.value = ""
  }
}

function toggleHighlighting(event) {
  chrome.storage.sync.set({ highlighting: event.target.checked })
}

const addTaskButton = document.getElementById("addTask")
addTaskButton.addEventListener("click", addTask)

const highlightCheckbox = document.getElementById("highlightCheckbox")
highlightCheckbox.addEventListener("click", toggleHighlighting)

chrome.storage.sync.get("tasks", ({ tasks }) => {
  if (tasks) tasks.forEach(task => {
    addListItem(task.name, task.id)
  });
})

chrome.storage.sync.get("highlighting", ({ highlighting }) => {
  highlightCheckbox.checked = highlighting
})