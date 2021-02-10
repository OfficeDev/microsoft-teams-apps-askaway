/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an orchestrator function.
 * Sends/Updates adaptive card.
 */

import { AzureFunction, Context } from "@azure/functions";
import { IAdaptiveCard } from "adaptivecards";
import {
  ActivityTypes,
  BotFrameworkAdapter,
  CardFactory,
  ConversationAccount,
  ConversationReference,
} from "botbuilder";
import {
  DataEventType,
  getUpdatedMainCard,
  IDataEvent,
} from "msteams-app-questionly.common";
import {
  height,
  width,
  title,
} from "../src/constants/notificationBubbleConstants";
import {
  questionDataService,
  qnaSessionDataService,
} from "../src/utils/dbUtility";
import { exceptionLogger } from "../src/utils/exceptionTracking";
import {
  getAvatarKey,
  getMicrosoftAppPassword,
} from "../src/utils/keyvaultUtility";

let adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId.toString(),
  appPassword: getMicrosoftAppPassword(),
});

/**
 * Creates channel data object for notification bubble.
 * @param eventData - event Data.
 */
const createChannelDataInfoForNotificationBubble = (
  eventData: IDataEvent
): any => {
  const appId = process.env.AppId.toString();
  const hostUserName: string = eventData.data.hostUser.name;
  const sessionTitle: string = eventData.data.title;

  const notificationBubblePageUrlWithParams = new URL(
    process.env.NotificationBubblePageUrl
  );

  notificationBubblePageUrlWithParams.searchParams.append(
    "username",
    hostUserName
  );

  notificationBubblePageUrlWithParams.searchParams.append(
    "title",
    sessionTitle
  );

  const encodedNotificationBubblePageUrlWithParam = encodeURIComponent(
    notificationBubblePageUrlWithParams.href
  );

  return {
    notification: {
      alertInMeeting: true,
      externalResourceUrl: `https://teams.microsoft.com/l/bubble/${appId}?url=${encodedNotificationBubblePageUrlWithParam}&height=${height}&width=${width}&title=${title}`,
    },
  };
};

/**
 * Send/update adaptive card.
 * @param adapter - bot framework adapter.
 * @param conversationReference - conversation reference.
 * @param qnaSessionId - qna session id.
 * @param card - latest adaptive card.
 * @param activityId - activity id of posted card if it is posted already.
 * @param channelData - channel data to post notification bubble.
 */
const sendOrUpdateCard = async (
  adapter: BotFrameworkAdapter,
  conversationReference: ConversationReference,
  qnaSessionId: string,
  card: IAdaptiveCard,
  activityId: string,
  channelData?: any
) => {
  await adapter.continueConversation(conversationReference, async (context) => {
    // If activity id is present, that means card is posted already and it has to be updated.
    if (activityId) {
      await context.updateActivity({
        id: activityId,
        attachments: [CardFactory.adaptiveCard(card)],
        type: ActivityTypes.Message,
      });
    } else {
      // For any reason, if the card was not posted earlier, post the card now.
      const resource = await context.sendActivity({
        attachments: [CardFactory.adaptiveCard(card)],
        type: ActivityTypes.Message,
        channelData: channelData,
      });

      // update activity id in DB.
      if (resource !== undefined) {
        await qnaSessionDataService.updateActivityId(qnaSessionId, resource.id);
      }
    }
  });
};

const activityFunction: AzureFunction = async function (
  context: Context
): Promise<void> {
  const qnaSessionId: string = context.bindings.name.qnaSessionId;
  const conversationId: string = context.bindings.name.conversationId;
  const serviceUrl: string = context.bindings.name.serviceUrl;
  const eventData: IDataEvent = context.bindings.name.eventData;
  const isSessionEnded = eventData.type === DataEventType.qnaSessionEndedEvent;
  const meetingId = context.bindings.name.meetingId;
  const operationId: string = context.bindings.name.operationId;
  // Adapter is injected as dependency for UTs.
  adapter = context.bindings.name.botFrameworkAdapter ?? adapter;

  // Fetch adaptive card and activity id for card refresh.
  const result = await getUpdatedMainCard(
    qnaSessionDataService,
    questionDataService,
    qnaSessionId,
    isSessionEnded,
    getAvatarKey()
  );

  try {
    const conversationReference = {
      serviceUrl: serviceUrl,
      channelId: "msteams",
      conversation: {
        id: conversationId,
      } as ConversationAccount,
    } as ConversationReference;

    if (eventData.type === DataEventType.qnaSessionCreatedEvent) {
      let channelData: any;

      // If it's a meeting chat, send notification bubble as well.
      if (meetingId) {
        channelData = createChannelDataInfoForNotificationBubble(eventData);
      }

      sendOrUpdateCard(
        adapter,
        conversationReference,
        qnaSessionId,
        result.card,
        result.activityId,
        channelData
      );
    } else {
      sendOrUpdateCard(
        adapter,
        conversationReference,
        qnaSessionId,
        result.card,
        result.activityId
      );
      // Update card last updated time in qnasession document.
      await qnaSessionDataService.updateDateTimeCardLastUpdated(
        qnaSessionId,
        new Date()
      );
    }
  } catch (error) {
    context.log.error(error, "Error occurred while updating adaptive card");
    exceptionLogger(error, operationId, {
      conversationId: conversationId,
      qnaSessionId: qnaSessionId,
      meetingId: meetingId,
      filename: module.id,
    });
  }
};

export default activityFunction;
