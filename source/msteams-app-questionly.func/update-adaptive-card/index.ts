/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an orchestrator function.
 * Sends/Updates adaptive card.
 */

import { AzureFunction, Context } from "@azure/functions";
import { IAdaptiveCard } from "adaptivecards";
import {
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

const activityFunction: AzureFunction = async function (
  context: Context
): Promise<void> {
  const qnaSessionId: string = context.bindings.name.qnaSessionId;
  const conversationId: string = context.bindings.name.conversationId;
  const serviceUrl: string = context.bindings.name.serviceUrl;
  const eventData: IDataEvent = context.bindings.name.eventData;
  const isSessionEnded = eventData.type === DataEventType.qnaSessionEndedEvent;
  const adapter: BotFrameworkAdapter =
    context.bindings.name.botFrameworkAdapter;

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
      await adapter.continueConversation(
        conversationReference,
        async (context) => {
          resource = await context.sendActivity({
            attachments: [CardFactory.adaptiveCard(card)],
          });
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
