/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an HTTP starter function.
 */

import * as df from "durable-functions";
import moment = require("moment");
import { exceptionLogger } from "../src/utils/exceptionTracking";
import {
  isCardRefreshNeededForQuestionEvent,
  isQnaStartedOrEndedEvent,
  isValidParam,
} from "../src/utils/requestUtility";
import { ifNumber } from "../src/utils/typeUtility";
import { IBackgroundJobPayload } from "msteams-app-questionly.common";

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

  // Background job payload.
  const payload: IBackgroundJobPayload = context.bindingData.input;

  // Conversation id from bot flow sometimes contain messageid
  const conversationId = payload.conversationId.split(";")[0];
  const serviceUrl = payload.serviceUrl;
  const meetingId = payload.meetingId;

  // Operation id for telemetry correaltion.
  const operationId = payload.operationId;

  try {
    const broadcastActivityInput = {
      conversationId: conversationId,
      eventData: payload.eventData,
      meetingId: meetingId,
      operationId: operationId,
      qnaSessionId: payload.qnaSessionId,
    };

    const updateAdaptivecardActivityInput = {
      conversationId: conversationId,
      eventData: payload.eventData,
      serviceUrl: serviceUrl,
      qnaSessionId: payload.qnaSessionId,
      meetingId: meetingId,
      operationId: operationId,
    };

    const parallelTasks = [];

    // Broadcast activity is only required in meeting context.
    if (isValidParam(meetingId)) {
      // Broadcast events to all clients from a meeting.
      parallelTasks.push(
        context.df.callActivityWithRetry(
          "broadcast-message",
          broadcastActivityRetryOption,
          broadcastActivityInput
        )
      );
    }

    if (isQnaStartedOrEndedEvent(payload.eventData)) {
      // Update adaptive card activity.
      parallelTasks.push(
        context.df.callActivityWithRetry(
          "update-adaptive-card",
          broadcastUpdateCardOption,
          updateAdaptivecardActivityInput
        )
      );
    }

    if (parallelTasks.length != 0) {
      yield context.df.Task.all(parallelTasks);
    }

    // Adaptive card does not need update for question marked as answered event.
    if (
      isCardRefreshNeededForQuestionEvent(context.bindingData.input.eventData)
    ) {
      const scheduleAdaptiveCardActivityInput = {
        qnaSessionId: context.bindingData.input.qnaSessionId,
      };

      const result: {
        scheduleNow: Boolean;
        scheduleLater: Boolean;
      } = yield context.df.callActivity(
        "schedule-adaptive-card",
        scheduleAdaptiveCardActivityInput
      );

      if (result.scheduleNow) {
        yield context.df.callActivityWithRetry(
          "update-adaptive-card",
          broadcastUpdateCardOption,
          updateAdaptivecardActivityInput
        );
      } else if (result.scheduleLater) {
        const maxWaitTimeForAdaptiveCardRefreshInMs = ifNumber(
          process.env.MaxWaitTimeForAdaptiveCardRefreshInMs,
          5000
        );

        const nextSchedule = moment
          .utc(context.df.currentUtcDateTime)
          .add(maxWaitTimeForAdaptiveCardRefreshInMs, "ms");

        yield context.df.createTimer(nextSchedule.toDate());
        yield context.df.callActivityWithRetry(
          "update-adaptive-card",
          broadcastUpdateCardOption,
          updateAdaptivecardActivityInput
        );
      }
    }
  } catch (error) {
    context.log.error(
      error,
      "Error occurred while scheduling background tasks"
    );
    exceptionLogger(error, operationId, {
      conversationId: conversationId,
      qnaSessionId: context.bindingData.input.qnaSessionId,
      filename: module.id,
    });
  }
});

export default orchestrator;
