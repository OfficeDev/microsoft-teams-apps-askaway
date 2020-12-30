import {
  initiateAndGetAppInsights,
  TraceData,
} from "msteams-app-questionly.common";

export let aiClient;

export const exceptionLogger = (
  error: Error,
  operationId?: string,
  traceData?: TraceData
) => {
  if (process.env.debugMode === "true") {
    // eslint-disable-next-line no-console
    console.error(error);
  } else {
    if (!aiClient) {
      aiClient = initiateAndGetAppInsights(
        process.env.APPINSIGHTS_INSTRUMENTATIONKEY
      );
    }
    aiClient.context.tags["ai.operation.parentId"] = operationId;
    aiClient?.trackException({
      exception: error,
      properties: traceData,
    });
  }
};
