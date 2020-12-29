import { TelemetryEvents } from 'src/constants/telemetryConstants';
import { getApplicationInsightsInstrumentationKeyURI } from 'src/util/keyvault';
import {
    initiateAndGetAppInsights,
    TraceData,
} from 'msteams-app-questionly.common';

export let aiClient;

export const initiateAIClient = async () => {
    if (!aiClient) {
        const applicationInsightsInstrumentationKey = await getApplicationInsightsInstrumentationKeyURI();
        aiClient = initiateAndGetAppInsights(
            applicationInsightsInstrumentationKey
        );
    }
};

export const exceptionLogger = (
    error: Error | string,
    traceData?: TraceData
) => {
    if (process.env.debugMode === 'true') {
        // eslint-disable-next-line no-console
        console.error(error);
    } else {
        aiClient?.trackException({
            exception: error,
            properties: traceData,
        });
    }
};

export const trackCreateQnASessionEvent = (traceData: TraceData) => {
    if (process.env.debugMode !== 'true') {
        aiClient?.trackEvent({
            name: TelemetryEvents.CreateQnASessionEvent,
            properties: traceData,
        });
    }
};

export const trackCreateQuestionEvent = (traceData: TraceData) => {
    if (process.env.debugMode !== 'true') {
        aiClient?.trackEvent({
            name: TelemetryEvents.CreateQuestionEvent,
            properties: traceData,
        });
    }
};
