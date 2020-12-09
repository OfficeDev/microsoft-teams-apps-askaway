# AskAway - `askAwayBot`

## How to register the bot in the Bot Framework portal

In order to create a bot you need to first register it in the [Azure portal](https://portal.azure.com/).

1. Choose to _Create a resource_, or alternatively go to an existing _resource group_ and click _Add_
2. Search for _Bot channels registration_ and then click _Create_
3. Give the bot a handle (ex: `askAwayBot`), choose your subscription and resource group
4. For the messaging endpoint, use this: `https://askAway.azurewebsites.net/api/messages`
5. Choose to _Auto create Microsoft App ID and Password_
6. Click _Create_
7. Wait for Azure to finish its magic and when done choose to go to resource
8. On the bot page choose _Channels_ and choose to add Microsoft Teams as a channel
9. Next, choose the _Settings_ and click on _Manage_ next to Microsoft App Id
10. In the Bot app portal, generate a new app password and store it securely - you will need them for your `.env` file or add them as application settings for the hosting web site (see below)

## How to configure the bot

Configure common node projects:
run init.bat from `msteams-app-questionly` root folder folder.
It will build and install common dependencies for the main web project and function project

```
init.bat
```

The App Id and App Secret, generated during the registration, for the bot are read from the `MicrosoftAppId` and `MicrosoftAppPassword` environment variables, specified in the `.env` file. Key vault resource name is read from `KeyVaultName` environment variable as well.

To authenticate rest endpoints, following settings are read from `.env` file.
`AzureAd_ClientId`
`AzureAd_ApplicationIdUri`
`AzureAd_Metadata_Endpoint`="https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration"
`AzureAd_ValidIssuers`="https://login.microsoftonline.com/TENANT_ID/v2.0,https://sts.windows.net/TENANT_ID/"
`TenantId`

These can be configured in the Azure Web App under _Application Settings > App Settings_.

Key vault resource should contain following secrets:
`MongoDbUri`,
`ApplicationInsightsInstrumentationKey`,
`MicrosoftAppPassword`,
`AvatarKey`

Read more on how to configure key vault [here](https://docs.microsoft.com/en-us/azure/key-vault/general/assign-access-policy-portal).

Following env variables are needed to run service layer project:

```
AzureAd_ClientId="{{AzureAd_ClientId}}"
AzureAd_ApplicationIdUri="{{AzureAd_ApplicationIdUri}}"
AzureAd_Metadata_Endpoint="https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration"
AzureAd_ValidIssuers="https://login.microsoftonline.com/TENANT_ID/v2.0,https://sts.windows.net/TENANT_ID/"
TenantId={{TenantId}}"
MicrosoftAppId="{{MicrosoftAppId}}"
HostName="{{ngrokId}}.ngrok.io"
KeyVaultName="{{KeyVaultName}}"
MongoDbUri="{{MongoDbUri}}"
ApplicationInsightsInstrumentationKey="{{ApplicationInsightsInstrumentationKey}}"
MicrosoftAppPassword="{{MicrosoftAppPassword}}"
AvatarKey="{{AvatarKey}}"
debugMode="true"
ASKAWAYTAB_APP_URI="{{ASKAWAYTAB_APP_URI}}"
NumberOfActiveAMASessions=1
BackgroundJobUri="http://localhost:7071/api/background-Job"
BackgroundFunctionKey=""
SignalRFunctionBaseUrl="http://localhost:7071"
```

local.settings.json for azure function layer:

```
{
  "IsEncrypted": false,
  "Values": {
    "WEBSITE_NODE_DEFAULT_VERSION": "~12",
    "AzureWebJobsStorage": "{{AzureWebJobsStorage}}",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "APPINSIGHTS_INSTRUMENTATIONKEY": "{{APPINSIGHTS_INSTRUMENTATIONKEY}}",
    "AzureAd_ApplicationIdUri": "{{AzureAd_ApplicationIdUri}}",
    "AzureAd_ValidIssuers": "https://login.microsoftonline.com/TENANT_ID/v2.0,https://sts.windows.net/TENANT_ID/",
    "TenantId": "{{TenantId}}",
    "AzureSignalRConnectionString": "{{AzureSignalRConnectionString}}",
    "MicrosoftAppId": "{{MicrosoftAppId}}",
    "MicrosoftAppPassword": "{{MicrosoftAppPassword}}",
    "MongoDbUri": "{{MongoDbUri}}",
    "AppId": "{{ManifestAppId}}",
    "NotificationBubblePageUrl": "{{NotificationBubblePageUrl}}",
    "NotificationBubbleActivityRetryInterval": 2000,
    "NotificationBubbleActivityRetryAttemptCount": 1,
    "BroadcastActivityRetryInterval": 1000,
    "BroadcastActivityRetryAttemptCount": 2,
    "MaxWaitTimeForAdaptiveCardRefreshInMs": 5000,
    "AvatarKey": "{{AvatarKey}}",
    "HostName": "{{HostName}}"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "http://localhost:8080,https://azure-samples.github.io",
    "CORSCredentials": true
  }
}

```

To run project locally, run azure function project first

```
cd source\msteams-app-questionly.func
npm run start
```

Then run service layer project

```
cd source\msteams-app-questionly
gulp serve
```
