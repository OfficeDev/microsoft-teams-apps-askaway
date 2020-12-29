import * as appInsights from "applicationinsights";

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

  return appInsights.defaultClient;
};
