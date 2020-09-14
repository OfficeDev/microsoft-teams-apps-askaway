import * as appInsights from 'applicationinsights';
import { getApplicationInsightsInstrumentationKeyURI } from 'src/util/keyvault';

export let aiClient;

export const initiateAppInsights = async () => {
    const applicationInsightsInstrumentationKey = await getApplicationInsightsInstrumentationKeyURI();

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

    aiClient = appInsights.defaultClient;
};

export const exceptionLogger = (error: Error) => {
    if (process.env.debugMode === 'true') {
        // eslint-disable-next-line no-console
        console.error(error);
    } else {
        aiClient.trackException({ exception: error });
    }
};
