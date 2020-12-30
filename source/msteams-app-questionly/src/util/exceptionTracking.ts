import { TelemetryEvents } from 'src/constants/telemetryConstants';
import { getApplicationInsightsInstrumentationKeyURI } from 'src/util/keyvault';
import {
    initiateAndGetAppInsights,
    TraceData,
} from 'msteams-app-questionly.common';
import * as appInsights from 'applicationinsights';

export let aiClient;

/**
 * Initiates telemetry client.
 */
export const initiateAIClient = async () => {
    if (!aiClient) {
        const applicationInsightsInstrumentationKey = await getApplicationInsightsInstrumentationKeyURI();
        aiClient = initiateAndGetAppInsights(
            applicationInsightsInstrumentationKey
        );
    }
};

/**
 * Get operation id for the current request.
 */
export const getOperationIdForCurrentRequest = () => {
    const context = appInsights.getCorrelationContext();
    return context?.operation.id;
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
