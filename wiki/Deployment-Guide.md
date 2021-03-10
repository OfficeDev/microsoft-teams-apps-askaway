### Prerequisites

To begin, you will need:

- An Azure subscription where you can create the following kinds of resources:
  - App Service
  - App Service Plan
  - Azure Cosmos DB account
  - Bot Channels Registration
  - Application Insights
- A copy of the Ask Away app GitHub [repo](https://github.com/OfficeDev/microsoft-teams-apps-askaway)

### Step 1: Register Azure Active Directory application

Register an Azure AD application in your tenant’s directory for the bot.

1. Open the Azure Active Directory panel in the Azure portal. If you are not in the correct tenant, click Switch directory to switch to the correct tenant. (For instructions on creating a tenant, see Access the portal and create a tenant.)
1. Open the App Registrations panel.
1. In the App Registrations panel, click New Registration.
1. Fill in the required fields and create the App Registration.

   - Name your application - if you are following the template for a default deployment, we recommend "Ask Away".
   - Select the Supported account type as Accounts in any organizational directory.
   - Leave the "Redirect URI" field blank for now.

   ![Deployment screenshot 1](images/deployment_screenshot1.png)

1. Click Register.
1. Once it is created, Azure displays the Overview page for the app.

   - Record the Application (client) ID value. You will use this value later as the Client ID when you register your Microsoft Azure Active Directory application with your bot.
   - Also record the Directory (tenant) ID value. You will also use this to register this application with your bot.
   - Verify that the "Supported account types" is set to Multiple organizations.

   ![Deployment screenshot 2](images/deployment_screenshot2.png)

1. In the navigation pane, click Certificates & secrets to create a secret for your application.
1. Under Client secrets, click New client secret.
1. Add a description to identify this secret from others you might need to create for this app, such as bot login.
1. Set Expires to Never.
1. Click Add.
1. Before leaving this page, record the secret. You will use this value later as the Client secret when you register your Microsoft Azure Active Directory application with your bot. You now have an application registered in Microsoft Azure Active Directory.
1. At this point, you will have:
   - Application id (this will be later used to register as bot id during ARM deployment)
   - Client secret
   - Tenant id

### Step 2: Deploy to your Azure subscription

1. Click on the "Deploy to Azure" button below.

   [![Deploy to Azure](https://camo.githubusercontent.com/8305b5cc13691600fbda2c857999c4153bee5e43/68747470733a2f2f617a7572656465706c6f792e6e65742f6465706c6f79627574746f6e2e706e67)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FOfficeDev%2Fmicrosoft-teams-apps-askaway%2Fmaster%2Fdeployment%2Fazuredeploy.json)

1. When prompted, log in to your Azure subscription.
1. Azure will create a "Custom deployment" based on the ARM template and ask you to fill in the template parameters. Please ensure that you don't use underscore (\_) or spaces in any of the field values otherwise the deployment may fail.
1. Select a subscription and resource group.
   - We recommend creating a new resource group.
   - The resource group location MUST be in a datacenter that supports: Application Insights, App Service, and Azure Cosmos DB. For an up-to-date list, click here, and select a region where the following services are available:
   - Application Insights
   - App Service
   - Azure Cosmos DB
1. Enter a "Base Resource Name", which the template uses to generate names for the other resources.
   - The app service name [Base Resource Name] must be available. For example, if you select “askaway” as the base name, the name “askaway” must be available (not taken); otherwise, the deployment will fail with a Conflict error.
   - Remember the base resource name that you selected. We will need it later.
1. Fill in the various IDs in the template:
   - Bot client ID: The application (client) ID of the Microsoft Teams bot app
   - Bot client secret: The client secret of the Microsoft Teams bot app
     Make sure that the values are copied as-is, with no extra spaces. The template checks that GUIDs are exactly 36 characters.
1. If you wish to change the app name, description, and icon from the defaults, modify the corresponding template parameters.
1. Agree to the Azure terms and conditions by clicking on the check box "I agree to the terms and conditions stated above" located at the bottom of the page.
1. Click on "Purchase" to start the deployment.
1. Wait for the deployment to finish. You can check the progress of the deployment from the "Notifications" pane of the Azure Portal. It can take up to an hour for the deployment to finish.
1. Once the deployment has finished, you would be directed to a page that has the following fields:
   - BotId - This is the Microsoft Application ID for Ask Away.
   - AppDomain - This is the base domain for Ask Away.

### Step 3: Create the Teams app packages

Create Teams app package:

1. Open the Manifest\manifest.json file in a text editor.
1. Change the placeholder fields in the manifest to values appropriate for your organization.
   - developer.name (What's this?)
   - developer.websiteUrl
   - developer.privacyUrl
   - developer.termsOfUseUrl
1. Manifest Id which is placed just above 'Version' needs to be same as one used while deployment.
1. Replace <botId> placeholder to your Azure Active Directory application's ID from above. This is the same GUID that you entered in the template under "Bot Client ID".
1. Replace all placeholders to AzureFD URL created during deployment. (e.g. https://askaway.azurefd.net)
1. Replace with application Id URL created in expose an API page in step 1.
1. In the "validDomains" section, replace with your Bot App Service's domain. This will be [BaseResourceName].azurefd.net. For example if you chose "askaway" as the base name, change the placeholder to askaway.azurefd.net.
1. Create a ZIP package with the manifest.json,color.png, and outline.png. The two image files are the icons for your app in Teams.
   - Name this package askaway.zip.
   - Make sure that the 3 files are the top level of the ZIP package, with no nested folders.

### Step 4: Run the apps in Microsoft Teams

1. If your tenant has sideloading apps enabled, you can install your app by following the instructions here
1. You can also upload it to your tenant's app catalog, so that it can be available for everyone in your tenant to install. See here
1. Install the end-user app (the askaway-enduser.zip package) to your users.

### Troubleshooting

Please see our [Troubleshooting](Troubleshooting.md) page.
