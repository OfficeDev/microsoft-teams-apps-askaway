import { Context, Logger } from "@azure/functions";

const getMockLogger = (): Logger => {
  let logger = function (...args: any[]) {} as Logger;
  logger.error = jest.fn();
  logger.warn = jest.fn();
  logger.info = jest.fn();
  logger.verbose = jest.fn();
  return logger;
};

export const mockContext: Context = {
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
    status: 200,
    body: {},
    json: jest.fn(),
  },
  done: jest.fn(),
};
