import { getConversationData } from "../../utils/dbUtility";
import { activityMockContext } from "../mocks/testContext";
import httpFunction from "./../../../schedule-adaptive-card/index";
import { qnaSessionDataService } from "msteams-app-questionly.data";

const sampleQnASessionId = "sampleQnASessionId";

let request: any;
let sampleContext: any;
// This env is set in jest.config.js file
const maxWaitTimeForAdaptiveCardRefreshInMs = Number(
  process.env.MaxWaitTimeForAdaptiveCardRefreshInMs
);
const timeShorterThanMaxWaitTimeForAdaptiveCardRefreshInMs =
  maxWaitTimeForAdaptiveCardRefreshInMs - 3000;
beforeAll(() => {
  (<any>getConversationData) = jest.fn();
  activityMockContext.bindings.name.sampleQnASessionId = sampleQnASessionId;
  (<any>qnaSessionDataService.getQnASession) = jest.fn();
  (<any>(
    qnaSessionDataService.updateDateTimeNextCardUpdateScheduled
  )) = jest.fn();
});

beforeEach(() => {
  jest.clearAllMocks();
  request = {
    body: {
      context: sampleContext,
    },
    headers: null,
  };
});

test("schedule adaptive card - first event after card is posted", async () => {
  (<any>qnaSessionDataService.getQnASession).mockImplementationOnce(() => {
    return {};
  });

  const result = await httpFunction(activityMockContext, request);

  expect(result.scheduleNow).toEqual(true);
  expect(result.scheduleLater).toEqual(false);
});

test("schedule adaptive card - schedule now", async () => {
  // last card posted was `maxWaitTimeForAdaptiveCardRefreshInMs` ms ago and no future refresh scheduled.
  (<any>qnaSessionDataService.getQnASession).mockImplementationOnce(() => {
    return {
      dateTimeCardLastUpdated: new Date(
        new Date().setMilliseconds(
          new Date().getMilliseconds() - maxWaitTimeForAdaptiveCardRefreshInMs
        )
      ),
      dateTimeNextCardUpdateScheduled: new Date(
        new Date().setMilliseconds(
          new Date().getMilliseconds() - maxWaitTimeForAdaptiveCardRefreshInMs
        )
      ),
    };
  });

  const result = await httpFunction(activityMockContext, request);

  expect(result.scheduleNow).toEqual(true);
  expect(result.scheduleLater).toEqual(false);
  expect(
    qnaSessionDataService.updateDateTimeNextCardUpdateScheduled
  ).toBeCalledTimes(0);
});

test("schedule adaptive card - schedule later", async () => {
  // last card posted was less than `maxWaitTimeForAdaptiveCardRefreshInMs` ms ago and no future refresh scheduled.
  (<any>qnaSessionDataService.getQnASession).mockImplementationOnce(() => {
    return {
      dateTimeCardLastUpdated: new Date(
        new Date().setMilliseconds(
          new Date().getMilliseconds() -
            timeShorterThanMaxWaitTimeForAdaptiveCardRefreshInMs
        )
      ),
      dateTimeNextCardUpdateScheduled: new Date(
        new Date().setMilliseconds(
          new Date().getMilliseconds() - maxWaitTimeForAdaptiveCardRefreshInMs
        )
      ),
    };
  });

  const result = await httpFunction(activityMockContext, request);

  expect(result.scheduleNow).toEqual(false);
  expect(result.scheduleLater).toEqual(true);
  expect(
    qnaSessionDataService.updateDateTimeNextCardUpdateScheduled
  ).toBeCalledTimes(1);
});

test("schedule adaptive card - do not schedule", async () => {
  // last card posted was less than `maxWaitTimeForAdaptiveCardRefreshInMs` ms ago and future refresh scheduled.
  (<any>qnaSessionDataService.getQnASession).mockImplementationOnce(() => {
    return {
      dateTimeCardLastUpdated: new Date(
        new Date().setMilliseconds(
          new Date().getMilliseconds() -
            timeShorterThanMaxWaitTimeForAdaptiveCardRefreshInMs
        )
      ),
      dateTimeNextCardUpdateScheduled: new Date(
        new Date().setMilliseconds(
          new Date().getMilliseconds() +
            timeShorterThanMaxWaitTimeForAdaptiveCardRefreshInMs
        )
      ),
    };
  });

  const result = await httpFunction(activityMockContext, request);

  expect(result.scheduleNow).toEqual(false);
  expect(result.scheduleLater).toEqual(false);
  expect(
    qnaSessionDataService.updateDateTimeNextCardUpdateScheduled
  ).toBeCalledTimes(0);
});
