# ATM
ATM - Automated Task Maker for Azure DevOps is a Chrome Extension that can be used to automatically create recurrent tasks to work packages in Azure DevOps.

## Installation
- Clone or download and unpack this repository
- Open Chrome's extension page `chrome://extensions`
- Enable 'Developer mode' at the top right
- Click 'Load unpacked' at the top left
- Select the root folder of this repository

## Configuration
- Click the puzzle piece icon right to your browser's address bar
- Pin the extension to always show it in the extensions bar
- Click the extension's icon to configure the recurring tasks that you want to add to your work packages
  - To add a task type the task's name to the input field and click 'Add'. The name will appear in the list of tasks on the configuration page
  - To remove a task just click on the task name in the list of tasks.
  
## Usage
- Open your sprint board
- Right click anywhere on the page (not on the work package or any other task, but at some free space on the page)
- In the context menu navigate to 'ATM'
- Navigate to the work package you want to create your recurring tasks for
  > **_NOTE:_** only work package in states 'Created' or 'Active' will appear in the menu
- Select either 'CREATE ALL TASKS' to create all your configured recurring tasks at once or select a single task to create
  > **_NOTE:_** tasks will be created as 'Unassigned' and with the same AreaPath and IterationPath than the work package they are created for
  
## Contribution
- Feel free to contribute and to create pull requests... 🤓
