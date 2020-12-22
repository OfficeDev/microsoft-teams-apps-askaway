/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an orchestrator function.
 * Sends/Updates adaptive card.
 */

import { AzureFunction, Context } from "@azure/functions";
import { IAdaptiveCard } from "adaptivecards";
import {
  Activity,
  ActivityTypes,
  BotFrameworkAdapter,
  CardFactory,
  ConversationAccount,
  ConversationReference,
} from "botbuilder";
import { DataEventType } from "msteams-app-questionly.common";
import { getUpdatedMainCard } from "../src/adaptive-card/mainCardBuilder";
import {
  qnaSessionDataService,
  questionDataService,
} from "msteams-app-questionly.data";
import { IDataEvent } from "msteams-app-questionly.common";
import {
  height,
  width,
  title,
} from "../src/constants/notificationBubbleConstants";

let adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId.toString(),
  appPassword: process.env.MicrosoftAppPassword.toString(),
});

const activityFunction: AzureFunction = async function (
  context: Context
): Promise<void> {
  const qnaSessionId: string = context.bindings.name.qnaSessionId;
  const conversationId: string = context.bindings.name.conversationId;
  const serviceUrl: string = context.bindings.name.serviceUrl;
  const eventData: IDataEvent = context.bindings.name.eventData;
  const isSessionEnded = eventData.type === DataEventType.qnaSessionEndedEvent;
  const meetingId = context.bindings.name.meetingId;
  // Adapter is injected as dependency for UTs.
  adapter = context.bindings.name.botFrameworkAdapter ?? adapter;

  // Fetch adaptive card and activity id for card refresh.
  const result = await getUpdatedMainCard(
    qnaSessionDataService,
    questionDataService,
    qnaSessionId,
    isSessionEnded
  );
  const card: IAdaptiveCard = result.card;

  try {
    const conversationReference = {
      serviceUrl: serviceUrl,
      channelId: "msteams",
      conversation: {
        id: conversationId,
      } as ConversationAccount,
    } as ConversationReference;

    if (eventData.type === DataEventType.qnaSessionCreatedEvent) {
      let resource;

      const activity = {
        type: ActivityTypes.Message,
        attachments: [CardFactory.adaptiveCard(card)],
      } as Activity;

      if (meetingId) {
        const appId = process.env.AppId.toString();
        const notificationBubblePageUrl = process.env.NotificationBubblePageUrl.toString();

        // If it's a meeting chat, send notification bubble as well.
        activity.channelData = {
          notification: {
            alertInMeeting: true,
            externalResourceUrl: `${encodeURIComponent(
              `https://teams.microsoft.com/l/bubble/${appId}?url=${notificationBubblePageUrl}&height=${height}&width=${width}&title=${title}`
            )}`,
          },
        };
      }

      await adapter.continueConversation(
        conversationReference,
        async (context) => {
          resource = await context.sendActivity(activity);
        }
      );
      if (resource !== undefined) {
        // Save activity id as card is getting posted for the first time.
        await qnaSessionDataService.updateActivityId(qnaSessionId, resource.id);
      }
    } else {
      await adapter.continueConversation(
        conversationReference,
        async (context) => {
          await context.updateActivity({
            id: result.activityId,
            attachments: [CardFactory.adaptiveCard(card)],
            type: "message",
          });
        }
      );

      // Update card last updated time in qnasession document.
      await qnaSessionDataService.updateDateTimeCardLastUpdated(
        qnaSessionId,
        new Date()
      );
    }
  } catch (error) {
    context.log.error(error, "Error occurred while updating adaptive card");
  }
};

export default activityFunction;
