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
  console.log(event.target)
  var idToRemove = event.target.id
  console.log(idToRemove)
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

chrome.storage.sync.get("tasks", ({ tasks }) => {
  if (tasks) tasks.forEach(task => {
    addListItem(task.name, task.id)
  });
})

const addTaskButton = document.getElementById("addTask")
addTaskButton.addEventListener("click", addTask)