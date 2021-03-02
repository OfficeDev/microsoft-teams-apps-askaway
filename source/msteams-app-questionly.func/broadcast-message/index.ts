import { AzureFunction, Context } from "@azure/functions";
import { trackBroadcastMessageEvent } from "../src/utils/exceptionTracking";

/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an orchestrator function.
 *
 * This activity broadcasts event to clients from provided group.
 */

const activityFunction: AzureFunction = async function (
  context: Context
): Promise<void> {
  const eventData = context.bindings.name.eventData;
  const conversationId = context.bindings.name.conversationId;

  context.bindings.signalRMessages = [
    {
      // message will only be sent to this group
      groupName: conversationId,
      target: "updateEvent",
      arguments: [eventData],
    },
  ];

  const qnaSessionId: string = context.bindings.name.qnaSessionId;
  const meetingId = context.bindings.name.meetingId;
  const operationId: string = context.bindings.name.operationId;

  trackBroadcastMessageEvent(operationId, {
    qnaSessionId: qnaSessionId,
    meetingId: meetingId,
    conversationId: conversationId,
    properties: {
      event: eventData,
    },
  });
};

export default activityFunction;
