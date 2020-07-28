import * as appInsights from 'applicationinsights';

export let aiClient;

export const initiateAppInsights = () => {
    // Set up app insights
    appInsights
        .setup(process.env.ApplicationInsightsInstrumentationKey)
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

    aiClient = appInsights.defaultClient;
};

export const exceptionLogger = (error: Error) => {
    if (process.env.debugMode == 'true') {
        console.error(error);
    } else {
        aiClient.trackException({ exception: error });
    }
};
