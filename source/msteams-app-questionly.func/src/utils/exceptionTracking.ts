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

/**
 * Logs event for broadcasting updates to clients.
 * @param operationId - operation id to correlate logs from service layer.
 * @param traceData - custom properties to log for this event.
 */
export const trackBroadcastMessageEvent = (
  operationId: string,
  traceData: TraceData
) => {
  if (process.env.debugMode !== "true") {
    if (!aiClient) {
      aiClient = initiateAndGetAppInsights(
        process.env.APPINSIGHTS_INSTRUMENTATIONKEY
      );
    }
    if (operationId) {
      aiClient.context.tags["ai.operation.parentId"] = operationId;
    }
    aiClient?.trackEvent({
      name: "EventBroadcasted",
      properties: traceData,
    });
  }
};
