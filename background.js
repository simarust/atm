chrome.runtime.onMessage.addListener(async request => {
  if (request.message == 'updateContextMenu') {
    const activeStates = ['Created', 'Active']

    let tasksToCreate
    chrome.storage.sync.get("tasks", ({ tasks }) => {
      tasksToCreate = tasks
    })

    chrome.contextMenus.removeAll()
    chrome.contextMenus.create({
      id: 'parent',
      title: 'ATM'
    })

    const currentPage = request.currentPage
    const pageRegex = /https:\/\/(\S*\/tfs)\/(\S*?)\/(\S*?)\/_sprints\/taskboard\/(\S*?)\/\S*?\/\S*?\/\S*?\/\S*?\/(\S*)/
    const match = currentPage.match(pageRegex)
    const instance = match[1]
    const collection = match[2]
    const project = match[3]
    const team = match[4]

    async function getIterations() {
      const iterationsListUrl = `https://${instance}/${collection}/${project}/${team}/_apis/work/teamsettings/iterations?api-version=5.0`
      const response = await fetch(iterationsListUrl)
      const json = await response.json()
      return json.value
    }

    async function getWorkItems(iterationId) {
      const workitemsUrl = `https://${instance}/${collection}/${project}/${team}/_apis/work/teamsettings/iterations/${iterationId}/workitems?api-version=5.0-preview.1`
      const response = await fetch(workitemsUrl)
      return await response.json()
    }

    async function getWorkItem(url) {
      const response = await fetch(url)
      return await response.json()
    }

    async function createTasks(workItemUrl, areaPath, iterationPath) {
      for (const task of tasksToCreate) {
        await createTask(workItemUrl, areaPath, iterationPath, task.name)
      }
    }

    async function createTask(workItemUrl, areaPath, iterationPath, taskName) {
      const createTaskUrl = `https://${instance}/${collection}/${project}/_apis/wit/workitems/$Task?api-version=5.0`
      const requestBody = [
        {
          "op": "add",
          "path": "/fields/System.Title",
          "from": null,
          "value": taskName
        },
        {
          "op": "add",
          "path": "/relations/-",
          "value": {
            "rel": "System.LinkTypes.Hierarchy-Reverse",
            "url": workItemUrl
          }
        },
        {
          "op": "add",
          "path": "/fields/System.AreaPath",
          "from": null,
          "value": areaPath
        },
        {
          "op": "add",
          "path": "/fields/System.IterationPath",
          "from": null,
          "value": iterationPath
        },{
          "op": "add",
          "path": "/fields/System.AssignedTo",
          "from": null,
          "value": ""
        }
      ]
      await fetch(createTaskUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json-patch+json'
        },
        body: JSON.stringify(requestBody)
      })
    }

    async function highlightTasksWithoutDescription(areaPath) {
      var workItemQuery = `SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'Task' AND [System.State] IN ('Defined', 'Started') AND [System.Description] IS EMPTY AND [System.AreaPath] = '${areaPath}'`
      const requestBody = {
        "query": workItemQuery
      }
      const wiqlUrl = `https://${instance}/${collection}/${project}/_apis/wit/wiql?api-version=5.0`
      const response = await fetch(wiqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      const json = await response.json()
      for (const workItem of json.workItems) {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
          chrome.tabs.sendMessage(tabs[0].id, {
            message: 'highlightTask',
            taskId: workItem.id
          })
        })
      }
    }

    function createContextMenus(workItem) {
      chrome.contextMenus.create({
        id: `${workItem.id}`,
        parentId: 'parent',
        title: `📋 ${workItem.fields['System.Title']}`
      })
      chrome.contextMenus.create({
        id: `${workItem.url}`,
        parentId: `${workItem.id}`,
        title: '🗃 CREATE ALL TASKS'
      })
      tasksToCreate.forEach(task => {
        chrome.contextMenus.create({
          id: `${workItem.url}|${task.name}`,
          parentId: `${workItem.id}`,
          title: `📄 ${task.name}`
        })
      })
    }

    const workitemUrls = []
    const areaPaths = []

    chrome.contextMenus.onClicked.addListener(async event => {
      const menuItemIdRegex = /([^\|]*)\|?(.*)/
      const match = event.menuItemId.match(menuItemIdRegex)
      var workItemUrl = match[1]
      var taskName = match[2]
      const workItem = await getWorkItem(workItemUrl)

      const areaPath = workItem.fields['System.AreaPath']
      const iterationPath = workItem.fields['System.IterationPath']
      if (taskName) {
        createTask(workItemUrl, areaPath, iterationPath, taskName)
      } else {
        createTasks(workItemUrl, areaPath, iterationPath)
      }
    })

    const iterations = await getIterations()
    for (const iteration of iterations) {
      const workItems = await getWorkItems(iteration.id)
      console.log(workItems)
      for (const relation of workItems.workItemRelations) {
        if (relation.rel == null) {
          const workItem = await getWorkItem(relation.target.url)
          const areaPath = workItem.fields['System.AreaPath']
          if (!areaPaths.includes(areaPath)) {
            areaPaths.push(areaPath)
            highlightTasksWithoutDescription(areaPaths)
          }
          if (!workitemUrls.includes(workItem.url) && activeStates.includes(workItem.fields['System.State'])) {
            workitemUrls.push(workItem.url)
            createContextMenus(workItem)
          }
        }
      }
    }
  }
})
