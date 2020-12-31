import {
  initiateAndGetAppInsights,
  TraceData,
} from "msteams-app-questionly.common";
import * as appInsights from "applicationinsights";

let aiClient: appInsights.TelemetryClient;

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
    if (operationId) {
      aiClient.context.tags["ai.operation.parentId"] = operationId;
    }
    aiClient?.trackException({
      exception: error,
      properties: traceData,
    });
  }
};
