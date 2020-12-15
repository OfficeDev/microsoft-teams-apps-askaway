import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { createBrowserHistory } from 'history';

let reactPlugin: ReactPlugin;
let appInsights: ApplicationInsights;

const createTelemetryService = () => {
    reactPlugin = new ReactPlugin();
    const key = process.env.ApplicationInsightsInstrumentationKey;
    const browserHistory = createBrowserHistory({ basename: '' });

    appInsights = new ApplicationInsights({
        config: {
            instrumentationKey: key,
            extensions: [reactPlugin],
            extensionConfig: {
                [reactPlugin.identifier]: { history: browserHistory },
            },
        },
    });
    appInsights.loadAppInsights();

    return {
        reactPlugin,
        appInsights,
    };
};

export const telemetryService = createTelemetryService();
