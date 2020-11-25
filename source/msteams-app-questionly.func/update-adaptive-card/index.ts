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
  BotFrameworkAdapter,
  CardFactory,
  ConversationAccount,
  ConversationReference,
} from "botbuilder";
import { setActivityId } from "../src/utils/dbUtility";

const activityFunction: AzureFunction = async function (
  context: Context
): Promise<void> {
  const activityId = context.bindings.name.activityId;
  const qnaSessionId = context.bindings.name.qnaSessionId;
  const card = context.bindings.name.card;
  const conversationId = context.bindings.name.conversationId;
  const serviceUrl = context.bindings.name.serviceUrl;

  const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId.toString(),
    appPassword: process.env.MicrosoftAppPassword.toString(),
  });

  const conversationReference = {
    serviceUrl: serviceUrl,
    channelId: "msteams",
    conversation: {
      id: conversationId,
    } as ConversationAccount,
  } as ConversationReference;

  if (activityId !== undefined) {
    // update activity
    await adapter.continueConversation(
      conversationReference,
      async (context) => {
        await context.updateActivity({
          id: activityId,
          attachments: [CardFactory.adaptiveCard(card)],
          type: "message",
        });
      }
    );
  } else {
    // send activity
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
      await setActivityId(qnaSessionId, resource.id);
    }
  }
};

export default activityFunction;
