import * as appInsights from "applicationinsights";
import { Contracts } from "applicationinsights";

let telemetryClient: appInsights.TelemetryClient;

export const initiateAndGetAppInsights = (
  applicationInsightsInstrumentationKey: string
) => {
  // Set up app insights
  appInsights
    .setup(applicationInsightsInstrumentationKey)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI);
  appInsights.start();

  telemetryClient = appInsights.defaultClient;
  telemetryClient.addTelemetryProcessor(addUserContext);

  return telemetryClient;
};

function addUserContext(envelope: Contracts.Envelope): boolean {
  const data = envelope.data["baseData"];
  if (data?.properties?.userAadObjectId) {
    telemetryClient.context.tags["ai.user.id"] =
      data.properties.userAadObjectId;
  }
  return true;
}
