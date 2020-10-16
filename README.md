---
page_type: sample
languages:
- typescript
products:
- office-teams
description: "Ask Away helps you easily gather questions for a Q & A event from within a Teams channel or chat."
urlFragment: "microsoft-teams-app-askaway"
---

# Ask Away - Teams App Template
| [Documentation](https://github.com/OfficeDev/microsoft-teams-apps-askaway/wiki/Home) | [Deployment guide](https://github.com/OfficeDev/microsoft-teams-apps-askaway/wiki/Deployment-Guide) | [Architecture](https://github.com/OfficeDev/microsoft-teams-apps-askaway/wiki/Solution-Overview) |
| ---- | ---- | ---- |

As organizations rely more on Teams to collaborate and do work, there is a need to connect organization leaders and SMEs (Subject Matter Experts) with their team members to share organizational updates and knowledge. With the onset of COVID-19, even more teams are conducting Q&A (Question and Answer) sessions remotely using Teams. Orchestrating one of these sessions directly in a Teams channel or chat is messy because hosts do not have a way to track questions and attendees do not have a way to upvote questions. Making it easier to conduct one of these sessions will add value to Teams and make it easier for users to collaborate and share knowledge.

The Ask Away app helps Q & A hosts easily gather questions for a Q & A event from within a Teams channel or chat. Team members can submit questions and upvote others shared by colleagues, resulting in a list of top-of-mind questions to give to the Q & A host. Because the bot runs in Teams, organizations can use it to conduct real-time sessions.

**Key features:**

With the Ask Away app in Microsoft Teams, attendees can:
* Submit questions.
* Upvote questions shared by colleagues.
* View a summary of top questions and general session updates on the main card.
* View all questions and associated upvote counts, with personally asked and top questions organized in the leaderboard.

Hosts can use the Ask Away app to:
* Start, manage, and end Q & A events.
* View a summary of top questions and general session updates on the main card.
* View all questions and associated upvote counts, with personally asked and top questions organized in the leaderboard

Here is an example screenshot of the main card:
![Ask Away main card](https://github.com/OfficeDev/microsoft-teams-apps-askaway/wiki/images/ui_screenshot1.png)

Screenshot of the leaderboard pop up box to vote on questions:
![Ask Away upvote dialog box](https://github.com/OfficeDev/microsoft-teams-apps-askaway/wiki/images/ui_screenshot2.png)

The app workflow is described below:
1. The host initiates a new Q & A event in a Teams channel or chat along with a live Teams call.
1. Attendees in the channel or chat submit questions during the duration of the event.
1. Everyone can view the leaderboard which organizes all the questions asked along with associated upvote counts.
1. Hosts will answer the questions submitted throughout the event through the Teams call.
1. Everyone can upvote questions in the leaderboard.
1. Everyone can view the top questions and general session updates on the main card.
1. Hosts will end the Q & A session once the event is complete.

## Legal notice

This app template is provided under the [MIT License](https://github.com/OfficeDev/microsoft-teams-apps-eprescription/blob/master/LICENSE) terms.  In addition to these terms, by using this app template you agree to the following:

- You, not Microsoft, will license the use of your app to users or organizations.

- You understand this app template is not intended to substitute your own regulatory due diligence or make you or your app compliant with applicable regulations including but not limited to privacy, healthcare, employment, and financial regulations.

- You are responsible for complying with all applicable privacy and security regulations including those related to use, collection and handling of any personal data by your app.  This includes complying with all internal privacy and security policies of your organization if your app is developed to be sideloaded internally within your organization.

- Where applicable, you may be responsible for data related incidents or data subject requests for data collected through your app.

-	Any trademarks or registered trademarks of Microsoft in the United States and/or other countries and logos included in this repository are the property of Microsoft, and the license for this project does not grant you rights to use any Microsoft names, logos or trademarks outside of this repository.  Microsoft’s general trademark guidelines can be found [here](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general.aspx).

-	Use of this template does not guarantee acceptance of your app to the Teams app store.  To make this app available in the Teams app store, you will have to comply with the [submission and validation process](https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/publish), and all associated requirements such as including your own privacy statement and terms of use for your app.

## Getting started

Begin with the [Solution overview](https://github.com/OfficeDev/microsoft-teams-apps-askaway/wiki/Solution-overview) to read about what the app does and how it works.

When you're ready to try out Ask Away, or to use it in your own organization, follow the steps in the [Deployment guide](https://github.com/OfficeDev/microsoft-teams-apps-askaway/wiki/Deployment-guide).

## Contributing

### This project was possible with the contributions of Microsoft Interns Lily Du, Shayan Khalili Moghaddam and Kavin Singh. Thank you to them and their mentors who helped convert a side project to a full Teams app template!

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
