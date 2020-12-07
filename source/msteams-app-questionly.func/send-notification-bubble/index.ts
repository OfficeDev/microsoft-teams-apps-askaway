/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an orchestrator function.
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
import { isQnaStartedOrEndedEvent } from "../src/utils/requestUtility";
import { IDataEvent } from "msteams-app-questionly.common";

const activityFunction: AzureFunction = async function (
  context: Context
): Promise<void> {
  try {
    const eventData: IDataEvent = context.bindings.name.eventData;
    const adapter: BotFrameworkAdapter =
      context.bindings.name.botFrameworkAdapter;

    // Notification bubble is only triggered for qna session created and ended event.
    if (isQnaStartedOrEndedEvent(eventData)) {
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

      await adapter.continueConversation(
        conversationReference,
        async (context) => {
          await context.sendActivity(activity);
        }
      );
    }
  } catch (error) {
    context.log.error(error);
    throw error;
  }
};

export default activityFunction;
