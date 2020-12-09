/*
 * This activity returns scheduling insights for adaptive card refresh.
 */

import { AzureFunction, Context } from "@azure/functions";
import moment from "moment";
import {
  qnaSessionDataService,
  IQnASession,
} from "msteams-app-questionly.data";
import { ifNumber } from "../src/utils/typeUtility";

const maxWaitTimeForAdaptiveCardRefreshInMs = ifNumber(
  process.env.MaxWaitTimeForAdaptiveCardRefreshInMs,
  5000
);

/**
 * This activity returns scheduling insights for adaptive card refresh.
 * @param context - azure durable function context
 * @returns - pair {scheduleNow, scheduleLater}: scheduleNow denoting if card refresh can be scheduled right away.
 * And scheduleLater denoting card refresh shall be scheduled after `maxWaitTimeForAdaptiveCardRefreshInMs`
 */
const activityFunction: AzureFunction = async function (
  context: Context
): Promise<{ scheduleNow: Boolean; scheduleLater: Boolean }> {
  const qnaSessionId: string = context.bindings.name.qnaSessionId;
  const qnaSessionData: IQnASession = await qnaSessionDataService.getQnASession(
    qnaSessionId
  );

  const currentTime = new Date().getTime();
  const lastUpdatedTime =
    qnaSessionData.dateTimeCardLastUpdated?.getTime() ?? 0;
  const nextScheduleTime =
    qnaSessionData.dateTimeNextCardUpdateScheduled?.getTime() ?? 0;

  // If card refresh is already scheduled, no need to refresh the card
  if (nextScheduleTime >= currentTime) {
    return { scheduleNow: false, scheduleLater: false };
  }
  // If card was last updated more than `maxWaitTimeForAdaptiveCardRefreshInMs` ago,
  // card can be refreshed again.
  else if (
    currentTime - lastUpdatedTime >
    maxWaitTimeForAdaptiveCardRefreshInMs
  ) {
    return { scheduleNow: true, scheduleLater: false };
  }

  // If card was recently updated, (less than `maxWaitTimeForAdaptiveCardRefreshInMs` ago)
  // and next card refresh is not scheduled, return indication to schedule card refresh.
  else {
    await qnaSessionDataService.updateDateTimeNextCardUpdateScheduled(
      qnaSessionId,
      moment
        .utc(new Date())
        .add(maxWaitTimeForAdaptiveCardRefreshInMs, "ms")
        .toDate()
    );

    return { scheduleNow: false, scheduleLater: true };
  }
};

export default activityFunction;
