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

**Didn't find your problem here?**
Please, report the issue [here](https://github.com/OfficeDev/microsoft-teams-apps-askaway/issues)
