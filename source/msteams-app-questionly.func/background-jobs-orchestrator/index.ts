/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an HTTP starter function.
 */

import * as df from "durable-functions";
import { ifNumber } from "../src/utils/typeUtility";

// Retry option for notification bubble activity
const notificationBubbleActivityRetryOption: df.RetryOptions = new df.RetryOptions(
  ifNumber(process.env.NotificationBubbleActivityRetryInterval, 2000),
  ifNumber(process.env.NotificationBubbleActivityRetryAttemptCount, 1)
);

// Retry option for broadcast message activity
const broadcastActivityRetryOption: df.RetryOptions = new df.RetryOptions(
  ifNumber(process.env.BroadcastActivityRetryInterval, 1000),
  ifNumber(process.env.BroadcastActivityRetryAttemptCount, 2)
);

// Retry option for update card activity
const broadcastUpdateCardOption: df.RetryOptions = new df.RetryOptions(
  ifNumber(process.env.BroadcastActivityRetryInterval, 1000),
  ifNumber(process.env.BroadcastActivityRetryAttemptCount, 2)
);

const orchestrator = df.orchestrator(function* (context) {
  if (!context.df.isReplaying) {
    context.log.info(
      `Background job started for conversation id ${context.bindingData.input.conversationId}`
    );
  }

  try {
    // Get conversation data before triggering any background job
    const conversation = yield context.df.callActivity(
      "startup-activities",
      context.bindingData.input.conversationId
    );
    if (conversation === undefined) {
      context.log.error(
        `Could not find conversation data for conversation id ${context.bindingData.input.conversationId}`
      );
      return;
    }

    // Create input object data with all the parameters required for background jobs.
    const inputData = {
      serviceUrl: conversation.serviceUrl,
      conversationId: context.bindingData.input.conversationId,
      qnaSessionId: context.bindingData.input.qnaSessionId,
      activityId: context.bindingData.input.cardData?.activityId,
      card: context.bindingData.input.cardData?.card,
    };

    const parallelTasks = [];

    // Broadcast events to all clients from a meeting.
    parallelTasks.push(
      context.df.callActivityWithRetry(
        "broadcast-message",
        broadcastActivityRetryOption,
        context.bindingData.input
      )
    );

    // Send notification bubble activity.
    parallelTasks.push(
      context.df.callActivityWithRetry(
        "send-notification-bubble",
        notificationBubbleActivityRetryOption,
        inputData
      )
    );

    // Update adaptive card activity.
    parallelTasks.push(
      context.df.callActivityWithRetry(
        "update-adaptive-card",
        broadcastUpdateCardOption,
        inputData
      )
    );

    yield context.df.Task.all(parallelTasks);
  } catch (error) {
    context.log.error(
      error,
      "Error occurred while scheduling background tasks"
    );
  }
});

export default orchestrator;
