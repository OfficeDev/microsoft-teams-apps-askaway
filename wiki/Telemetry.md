Ask Away app logs telemetry to [Azure Application Insights](https://azure.microsoft.com/en-us/services/monitor). You can go to the Application Insights blade of the Azure App Service to view basic telemetry about your services, such as requests, failures, dependency errors, custom events, and traces.

App integrates with Application Insights to gather bot activity analytics, as described [here](https://blog.botframework.com/2019/03/21/bot-analytics-behind-the-scenes/).

The app logs for this event:

`Exceptions` logs keeps the records of exceptions tracked in the application.

The app is also set to auto collect requests, performance, dependencies, and console statements.
