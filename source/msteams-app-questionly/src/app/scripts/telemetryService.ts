import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web';
import { createBrowserHistory } from 'history';

let reactPlugin: ReactPlugin;
let appInsights: ApplicationInsights;

/**
 * Get react plugin instance.
 */
export const getReactPlugin = () => {
    if (!reactPlugin) {
        reactPlugin = new ReactPlugin();
    }
    return reactPlugin;
};

/**
 * Initilaizes application insights.
 * @param applicationInsightsInstrumentationKey - application instrumentation key.
 */
export const initializeTelemetryService = (applicationInsightsInstrumentationKey: string) => {
    const browserHistory = createBrowserHistory({ basename: '' });

    appInsights = new ApplicationInsights({
        config: {
            instrumentationKey: applicationInsightsInstrumentationKey,
            extensions: [getReactPlugin()],
            extensionConfig: {
                [getReactPlugin().identifier]: { history: browserHistory },
            },
        },
    });
    appInsights.loadAppInsights();
};

/**
 * Log message along with severity level to telemetry.
 * @param message - message
 * @param severityLevel - severity level.
 */
export const trackTrace = (message: string, severityLevel: SeverityLevel) => {
    if (appInsights) {
        appInsights.trackTrace({
            message: message,
            severityLevel: severityLevel,
        });
    }
};

/**
 * Log errors along with severity level and properties, if present.
 * @param exception - error
 * @param severityLevel - severity level.
 * @param properties - optional properties to be logged.
 */
export const trackException = (exception: Error, severityLevel: SeverityLevel, properties?: { [key: string]: any }) => {
    if (appInsights) {
        appInsights.trackException({
            exception: exception,
            severityLevel: severityLevel,
            properties: properties,
        });
    }
};

/**
 * Log events to telemetry.
 * @param eventName - event name
 * @param properties - optional properties
 */
export const trackEvent = (eventName: string, properties?: { [key: string]: any }) => {
    if (appInsights) {
        appInsights.trackEvent({ name: eventName }, properties);
    }
};
