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

The App Id and App Secret, generated during the registration, for the bot are read from the `MicrosoftAppId` and `MicrosoftAppPassword` environment variables, specified in the `.env` file. Key vault resource name is read from `KeyVaultName` environment variable as well.
These can be configured in the Azure Web App under _Application Settings > App Settings_.

Key vault resource should contain following secrets:
`MongoDbUri`,
`ApplicationInsightsInstrumentationKey`,
`MicrosoftAppPassword`,
`AvatarKey`

Read more on how to configure key vault [here](https://docs.microsoft.com/en-us/azure/key-vault/general/assign-access-policy-portal).
