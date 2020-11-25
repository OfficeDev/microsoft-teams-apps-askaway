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
} from "botbuilder";
import {
  height,
  width,
  title,
} from "../src/constants/notificationBubbleConstants";
import { getConversationData } from "../src/utils/dbUtility";

const activityFunction: AzureFunction = async function (
  context: Context
): Promise<void> {
  try {
    const conversationId = context.bindings.name.conversationId;
    const serviceUrl = context.bindings.name.serviceUrl;
    const appId = process.env.AppId.toString();
    const notificationBubblePageUrl = process.env.NotificationBubblePageUrl.toString();

    const activity = {
      type: ActivityTypes.Message,
      text: "Ask Away",
      channelData: {
        notification: {
          alertInMeeting: true,
          externalResourceUrl: `https://teams.microsoft.com/l/bubble/${appId}?url=${notificationBubblePageUrl}&height=${height}&width=${width}&title=${title}`,
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

    await adapter.continueConversation(
      conversationReference,
      async (context) => {
        await context.sendActivity(activity);
      }
    );
  } catch (error) {
    context.log.error(error);
    throw error;
  }
};

export default activityFunction;
