/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an orchestrator function.
 *
 * Before running this sample, please:
 * - create a Durable orchestration function
 * - create a Durable HTTP starter function
 * - run 'npm install durable-functions' from the wwwroot folder of your
 *   function app in Kudu
 */

import { AzureFunction, Context } from "@azure/functions";

import {
  Activity,
  ActivityTypes,
  BotFrameworkAdapter,
  ConversationAccount,
  ConversationReference,
  TurnContext,
} from "botbuilder";

const activityFunction: AzureFunction = async function (
  context: Context
): Promise<void> {
  // hard coded service url for now. Will get this from conversation document later.
  const serviceUrl = "https://smba.trafficmanager.net/amer/";
  const conversationId = context.bindings.name.conversationId;
  const appId = process.env.AppId.toString();
  // to be changed later to notification bubble page
  const bubblePageUrl = process.env.NotificationBubblePageUrl.toString();

  const activity = {
    type: ActivityTypes.Message,
    text: "Hello",
    channelData: {
      notification: {
        alertInMeeting: true,
        externalResourceUrl: `https://teams.microsoft.com/l/bubble/${appId}?url=${bubblePageUrl}&height=180&width=280&title=Ask Away`,
      },
    },
  } as Activity;

  const conversationReference = {
    serviceUrl: serviceUrl,
    channelId: "msteams",
    conversation: {
      id: conversationId,
    } as ConversationAccount,
  } as ConversationReference;

  const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId.toString(),
    appPassword: process.env.MicrosoftAppPassword.toString(),
  });

  await adapter.continueConversation(conversationReference, async (context) => {
    await context.sendActivity(activity);
  });
};

export default activityFunction;
