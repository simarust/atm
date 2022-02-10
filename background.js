chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.message == 'updateContextMenu') {
    const activeStates = ['Created', 'Active']

    let tasksToCreate
    chrome.storage.sync.get("tasks", ({ tasks }) => {
      console.log(`TASKS: ${tasks}`)
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
      return json
    }

    async function getWorkItems(iterationId) {
      const workitemsUrl = `https://${instance}/${collection}/${project}/${team}/_apis/work/teamsettings/iterations/${iterationId}/workitems?api-version=5.0-preview.1`
      const response = await fetch(workitemsUrl)
      const json = await response.json()
      return json
    }

    async function getWorkItem(url) {
      const response = await fetch(url)
      const json = await response.json()
      return json
    }

    function createTasks(workItemUrl, areaPath, iterationPath) {
      tasksToCreate.forEach(task => {
        createTask(workItemUrl, areaPath, iterationPath, task.name)
      })
    }

    function createTask(workItemUrl, areaPath, iterationPath, taskName) {
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
      fetch(createTaskUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json-patch+json'
        },
        body: JSON.stringify(requestBody)
      })
    }

    const workitemUrls = []

    chrome.contextMenus.onClicked.addListener(event => {
      const menuItemIdRegex = /([^\|]*)\|?(.*)/
      const match = event.menuItemId.match(menuItemIdRegex)
      console.log(match)
      var workItemUrl = match[1]
      var taskName = match[2]
      getWorkItem(workItemUrl).then(workItem => {
        const areaPath = workItem.fields['System.AreaPath']
        const iterationPath = workItem.fields['System.IterationPath']
        if (taskName) {
          createTask(workItemUrl, areaPath, iterationPath, taskName)
        } else {
          createTasks(workItemUrl, areaPath, iterationPath)
        }
      })
    })

    await getIterations().then(iterations => {
      iterations.value.forEach(iteration => {
        getWorkItems(iteration.id).then(workItems => {
          workItems.workItemRelations.forEach(relation => {
            if (relation.rel == null) {
              getWorkItem(relation.target.url).then(workItem => {
                console.log(workItem)
                if (!workitemUrls.includes(workItem.url) && activeStates.includes(workItem.fields['System.State'])) {
                  workitemUrls.push(workItem.url)
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
              })
            }
          })
        })
      })
    })
  }
})
