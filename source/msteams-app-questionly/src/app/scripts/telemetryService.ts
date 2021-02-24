import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web';
import { createBrowserHistory } from 'history';

let reactPlugin: ReactPlugin;
let appInsights: ApplicationInsights;

export const getReactPlugin = () => {
    if (!reactPlugin) {
        reactPlugin = new ReactPlugin();
    }
    return reactPlugin;
};

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

export const trackTrace = (message: string, severityLevel: SeverityLevel) => {
    if (appInsights) {
        appInsights.trackTrace({
            message: message,
            severityLevel: severityLevel,
        });
    }
};

export const trackException = (exception: Error, severityLevel: SeverityLevel, properties?: any) => {
    if (appInsights) {
        appInsights.trackException({
            exception: exception,
            severityLevel: severityLevel,
            properties: properties,
        });
    }
};
