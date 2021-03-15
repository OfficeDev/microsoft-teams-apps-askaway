### Common app template issues:

Certain issues can arise that are common to many of the app templates. Please check [here](https://github.com/OfficeDev/microsoft-teams-stickers-app/wiki/Troubleshooting) for reference to these.

### Problems deploying to Azure

1.  **Forgetting the botId or appDomain**

    If you forgot your botId and appDomain values from the end of the deployment, you can find them in the "Configuration" section of your Web App.

    - botId: This is the Microsoft Application ID for the Ask Away app. It can be found in the "MicrosoftAppId" field of your configuration e.g. 5630f8a2-c2a0-4cda-bdfa-c2fa87654321.
    - appDomain: This is the base domain for the Ask Away app. It is the value in the HostName field of your configuration without the ‘.azurewebsites.net’.

2.  **Error while deploying the ARM Template**

        This happens when the resources are already created or due to some conflicts.
        Errors: The resource operation completed with terminal provisioning state 'Failed'
        Fix
        In case of such a scenario, you need to navigate to the deployment center section of failed/conflict resources through the Azure portal and check the error logs to get the actual errors and fix them accordingly.

    Redeploy it after fixing the issue/conflict.

### Error while running Powershell script

1. **Error due to execution policy**

   This happens if the the execution policy is not bypassed.<br/>
   Error: The file '<file_name>' is not digitally signed. You cannot run this script on the current system.<br/>
   Fix: Run command `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

2. **Error creating database account**

    ```The subscription is exceeding the maximum number of allowed DatabaseAccounts. The current DatabaseAccount count is {count} and maximum allowed DatabaseAccounts are {count}```
    
    * In this case, you can [raise a request](https://docs.microsoft.com/en-us/azure/cosmos-db/concepts-limits#control-plane-operations) to increare maximum database accounts per subscription.
    * You can delete any older instance of database account in the same subscription, which is currently not in use.
    * You can also choose to switch to different subscription for which this limit is not reached.

3. **Error while creating a zip**

    ``` Cannot find path '..\temp_msteams-app-questionly.zip' because it does not exist.```

    ``` Cannot find path '..\temp_msteams-app-questionly.func.zip' because it does not exist.```

    This means there is an error while creating zip files. Locate `temp_msteams-app-questionly`/ `temp_msteams-app-questionly.func` in source folder. Manually zip content inside these folders and create required zip files and place them in source folder.
    Run `zipDeploy.ps1` script.

4. **NPM version issue**
    
    ```This version of npm is compatible with lockfileVersion@1, but package-lock.json was generated for lockfileVersion@2```
    
    * Please run `npm install -g npm@7.6.0`. 

**Didn't find your problem here?**
Please, report the issue [here](https://github.com/OfficeDev/microsoft-teams-apps-askaway/issues)