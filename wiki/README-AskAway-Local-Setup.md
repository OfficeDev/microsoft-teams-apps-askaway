[[_TOC_]]

# Setup 'Ask Away' app locally

## Prerequisites
|Node|version >= v12.16.0| [link](https://nodejs.org/en/download/) |
|--|--|--|
|Npm  | version >= 7.6.0 | [link](https://nodejs.org/en/download/) |
| Azure Functions Core Tools | v3 | `npm i -g azure-functions-core-tools@3 --unsafe-perm true` |
| Azure Storage Emulator | any | [link](https://go.microsoft.com/fwlink/?linkid=717179&clcid=0x409) |  
| gulp | >= 4.0.0 | `npm i -g gulp gulp-cli` |
| Visual Studio Code | >= 1.51.1 | [link](https://code.visualstudio.com/) | 
| ngrok | any | [link](https://ngrok.com/) |

## Azure Resources

Following azure resources are needed to support local deployment.

Note: You can reuse resources from arm template deployment, if you have done it previously.

### Bot channel registration
In order to create a bot you need to first register it in the [Azure portal](https://portal.azure.com/).

1. Choose to `Create a resource`, or alternatively go to an existing `resource group` and click `Add`
2. Search for `Bot channels registration` and then click `Create`
3. Give the bot a handle (ex: `askAwayBot`), choose your subscription and resource group
4. Toggle switch to `On` option for `Application Insights` option.
5. Select `Auto create Microsoft App ID and Password`
6. Click `Create`
7. Wait for Azure to finish its magic and when done choose to go to resource
8. On the bot page choose `Channels` and choose to add Microsoft Teams as a channel
9. Next, choose `Settings` tab and click on _Manage_ next to Microsoft App Id
10. In the Bot app portal, generate a new app password and store it securely - you will need them for project configuration.

### Application Insights
1. This resource will get created as part of your bot channel registration resource.
2. If not, you can always create it from azure portal separately, [link](https://docs.microsoft.com/en-us/azure/azure-monitor/app/create-new-resource).
3. Copy and store `Instrumentation Key` from Overview section of application insight resource.

### Cosmos db with mongodb api

This project uses cosmos db to store data.

1. Choose to `Create a resource`, or alternatively go to an existing `resource group` and click `Add`
2. Search for `Azure Cosmos DB` and then click `Create`
3. Provide unique Account Name (ex: `askawayDB`) and select `Azure Cosmos DB for MongoDB API` for API value.
4. Configure rest of the parameters according to your need.
5. Click on `Review + create` and wait till your resource gets created.
6. Store `PRIMARY CONNECTION STRING` from Connection String tab, it will be used later for project configuration.


### SignalR Service
SignalR service powers real time UX for tab application.

1. Choose to `Create a resource`, or alternatively go to an existing `resource group` and click `Add`
2. Search for `SignalR Service` and then click `Create`
3. Provide unique name to `Resource Name` input (eg. `askawaysignalR`).
4. Set `Service mode` to `Serverless`.
4. Configure rest of the parameters according to your need.
5. Click on `Review + create` and wait till your resource gets created.
6. Copy and store `PRIMARY CONNECTION STRING` from  `Keys` section, it will be used later for project configuration.

## Tunnel local bot project endpoints  
`ngrok` is a handy tool to publish local endpoint on a public DNS.

 Bot project runs locally on port 3007. Run following ngrok command to expose bot endpoints publically:
```
ngrok http -host-header=localhost 3007
```
Copy the forwarding domain url provided by ngrok as part of above command.
Let's refer it as `botTunnelUrl` eg: `c6583f4cb845.ngrok.io`

The ngrok url expires after 8 hours. To avoid this, sign in to https://ngrok.com/. (using gmail/github) and locate your authtoken [here](https://dashboard.ngrok.com/auth/your-authtoken).

Run following command to set auth token in ngrok config.

```
./ngrok authtoken <Your token>
```

After this step, run `ngrok http -host-header=localhost 3007` and the ngrok url will not expire.

## Message endpoint for bot channel registration resource
1. Go to your bot channel registration resource.
2. Under Settings, locate message endpoint input box
3. Update it with value: `https://<botTunnelUrl>/api/messages`
4. Save the settings.

## Set up Authentication

1. Go to App Registrations page in Azure portal and open the app generated during the registration.
2. Under `Manage`, click on `Expose an API`. 
    - Set _Application ID URI_ to `api://<botTunnelUrl>/<MicrosoftAppId>` and _Save_ your changes. You can get these values from `Bot channel registration` resource creation step.
    - Click on _Add a scope_, under _Scopes_ defined by this API. In the flyout that appears, enter the following values and _Add Scope_.
        - _Scope name_: access_as_user
        - _Who can consent?_: Admins and users
        - _Admin and user consent display name_: Access the API as the current logged-in user
        - _Admin and user consent description_: Access the API as the current logged-in user
3. Click _Add a client application_, under _Authorized client applications_. In the flyout that appears, enter the following values and _Add application_.
    - _Client ID_: 5e3ce6c0-2b1f-4285-8d4b-75ee78787346
    - _Authorized scopes -: Select the scope that ends with access_as_user. (There should only be 1 scope in this list.)
    - Repeat the above two steps but with client ID = `1fec8e78-bce4-4aaf-ab1b-5451cc387264`. After this step you should see to client applications (`5e3ce6c0-2b1f-4285-8d4b-75ee78787346` and `1fec8e78-bce4-4aaf-ab1b-5451cc387264`) listed under `Authorized client applications`.
4. Under Manage, click on Authentication to bring up authentication settings. Add a new entry to Redirect URIs:
    - Type: Web
    - Redirect URI: Enter `https://<botTunnelUrl>/auth-end`.
    - Under _Implicit grant_, check ID tokens.
    - Click _Save_ to commit your changes.

## Configuration

* Azure function project

 Locate `local.settings.json` in `repo\source\msteams-app-questionly.func` folder and update it with following values.

```
AzureWebJobsStorage: "UseDevelopmentStorage=true"
```

```
// You can get this value from `Application Insights` resource creation step.
APPINSIGHTS_INSTRUMENTATIONKEY:"<APPINSIGHTS_INSTRUMENTATIONKEY>"
```

```
// You can get these values from `Set up Authentication` step.
"AzureAd_ClientId": "{{AzureAd_ClientId}}",
"AzureAd_ApplicationIdUri": "{{AzureAd_ApplicationIdUri}}",
"AzureAd_ValidIssuers": "https://login.microsoftonline.com/TENANT_ID/v2.0,https://sts.windows.net/TENANT_ID/",
"TenantId": "{{TenantId}}", 
```

```
// You can get these values from `Bot channel registration` resource creation step.
MicrosoftAppId:"<MicrosoftAppId>"
AppId: "{{MicrosoftAppId}}" // unique id provided to app in manifest.json.
MicrosoftAppPassword:"<MicrosoftAppPassword>"
AvatarKey:"<MicrosoftAppPassword>" // This value is same as MicrosoftAppPassword
```

```
// You can get this value from `Cosmos db with mongodb api` resource creation step.
MongoDbUri:"<MongoDbUri>"
```

```
// You can get this value from `SignalR Service` creation step.
AzureSignalRConnectionString: "{{AzureSignalRConnectionString}}",
```

```
NotificationBubblePageUrl: "https://<botTunnelUrl>/askAwayTab/qnasessioncreatednotification.html"
HostName: "<botTunnelUrl>"
```

```
OrphanedAmaSessionExpiryInSeconds: 86400
```

```
// Debug mode flag
debugMode:"true"
 ```

 ```
 // Tenant id in which app service and function app is created.
 SubscriptionTenantId:"<SubscriptionTenantId>"
 ```

* Bot project

 Create .env file inside `repo\source\msteams-app-questionly` folder and update it with following values


```
// You can get following values from app registration, refer to step `Set up Authentication`
AzureAd_ClientId="<AzureAd_ClientId>"  
AzureAd_ApplicationIdUri="<AzureAd_ApplicationIdUri>"
TenantId="<TenantId>"
ASKAWAYTAB_APP_URI="<AzureAd_ClientId>"


AzureAd_Metadata_Endpoint="https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration"
AzureAd_ValidIssuers="https://login.microsoftonline.com/TENANT_ID/v2.0,https://sts.windows.net/TENANT_ID/"

```

```
// Find these values from Bot channel registration resource creation steps:
MicrosoftAppId="<MicrosoftAppId>"
MicrosoftAppPassword="<MicrosoftAppPassword>"
AvatarKey="<MicrosoftAppPassword>" // Same as MicrosoftAppPassword
```

```
// Find this value from `Cosmos db with mongodb api` resource creation step
MongoDbUri=<MongoDbUri>
```

```
// Find this value from `Application Insights` resouce creation step
ApplicationInsightsInstrumentationKey=<ApplicationInsightsInstrumentationKey>
```

```
NumberOfActiveAMASessions=1
```

```
BackgroundFunctionKey="" // This key is not required for local deployment.
BackgroundJobUri="http://localhost:7071/api/background-job"
SignalRFunctionBaseUrl="http://localhost:7071"
```


```
HostName="<botTunnelUrl>"
```

```
OrphanedAmaSessionExpiryInSeconds: 86400
```

```
// Debug mode flag
debugMode="true"
```

```
port=3007
```

## Build 

Run init.bat from `msteams-app-questionly` root folder folder.
It will build and install common dependencies for the main web project and function project

```
init.bat
```

## Run

* Azure function project

Start azure storage Emulator.
1. Search for `Azure Storage Emulator` from windows search menu and start the emulator. [link](https://docs.microsoft.com/en-us/azure/storage/common/storage-use-emulator)

2. Run following commands
```
cd repo\source\msteams-app-questionly.func
npm run start
```

* Bot project

```
cd repo\source\msteams-app-questionly
npm run start
```

## Manifest
* Locate `manifest.json` in `repo\manifet`. 
* Replace `{{MicrosoftAppId}}` occurrence with MicrosoftAppId value, You can get these values from `Bot channel registration` resource creation step.
* Replace `{{HostName}}` with botTunnelUrl.
* Zip `manifest.json`, `icon-color.png` and `icon-outline.png` into manifest.zip.
* [Side load](https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) the app in MS Teams.

# Troubleshooting guide

* If you run into `'func' is not recognized as an internal or external command` please run following command throught cmd.
```
npm i -g azure-functions-core-tools@3 --unsafe-perm true
```
* If you run into `File 'C:\Program Files\dotnet\dotnet.exe' is not found`, install `.net core` from [here](https://dotnet.microsoft.com/download).
* If you face issue wrt port unavailability 
    * `Port 7071 is not available`, update `LocalHttpPort` from `local.settings.json` to some other value. Update `SignalRFunctionBaseUrl` and `BackgroundJobUri` accordingly in .env file.
    * `Port 3007 is not available`, update `port` from .env to some other value. Rerun ngrok command with updated port and update `botTunnelUrl` everywhere with new tunnel url.
* If you face following issue in bot cmd and adaptive card does not get posted
```
Error: write EPROTO 15556:error:1408F10B:SSL routines:ssl3_get_record:wrong version number:c:\ws\deps\openssl\openssl\ssl\record\ssl3_record.c:332:
 
    at WriteWrap.onWriteComplete [as oncomplete] (internal/stream_base_commons.js:94:16)
    at WriteWrap.callbackTrampoline (internal/async_hooks.js:131:14) {​​​​​​
  errno: -4046,
  code: 'EPROTO'
  ```

  make sure that value for `BackgroundJobUri` is correct with `http` instead of `https` protocol in .env file.

* 401 Unauthorized error: If your client app requests don't pass through and throw 401 aunauthorized error
    * Make sure your app is running in the same tenant whose tenant id is provided in `local.settings.json` and `.env`.
    * Make sure your app registration/ manifest and following fields are updated with latest ngrok host.
        * AzureAd_ApplicationIdUri
        * ASKAWAYTAB_APP_URI
* `Error: Server returned handshake error: SignalR Service is now in 'Default' service mode`
    * Make sure your SignalR service mode is set to `Serverless`
    * You can check this setting at SignalR Service -> Settings -> Service Mode.