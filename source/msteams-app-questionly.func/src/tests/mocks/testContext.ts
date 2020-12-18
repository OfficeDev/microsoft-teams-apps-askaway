import { Context, Logger } from "@azure/functions";
import { DataEventType } from "msteams-app-questionly.common";
import { StatusCodes } from "http-status-codes";

const getMockLogger = (): Logger => {
  let logger = function (...args: any[]) {} as Logger;
  logger.error = jest.fn();
  logger.warn = jest.fn();
  logger.info = jest.fn();
  logger.verbose = jest.fn();
  return logger;
};

export const triggerMockContext: Context = {
  bindings: {},
  bindingData: {},
  bindingDefinitions: [],
  log: getMockLogger(),
  invocationId: null,
  executionContext: {
    invocationId: null,
    functionName: "httpTrigger",
    functionDirectory: null,
  },
  traceContext: null,
  res: {
    status: StatusCodes.OK,
    body: {},
    json: jest.fn(),
  },
  done: jest.fn(),
};

const sampleConversationId = "sampleConversationId";
const sampleActivityId = "sampleActivityId";
const sampleQnASessionId = "sampleQnASessionId";
const sampleCard = "sampleCard";
const sampleSericeUrl = "sampleServiceUrl";

export const activityMockContext: Context = {
  bindings: {
    name: {
      conversationId: sampleConversationId,
      qnaSessionId: sampleQnASessionId,
      activityId: sampleActivityId,
      serviceUrl: sampleSericeUrl,
      card: sampleCard,
      eventData: {
        type: DataEventType.qnaSessionCreatedEvent,
      },
    },
  },
  bindingData: {},
  bindingDefinitions: [],
  log: getMockLogger(),
  invocationId: null,
  executionContext: {
    invocationId: null,
    functionName: "activityTrigger",
    functionDirectory: null,
  },
  traceContext: null,
  res: {
    status: StatusCodes.OK,
    body: {},
    json: jest.fn(),
  },
  done: jest.fn(),
};
