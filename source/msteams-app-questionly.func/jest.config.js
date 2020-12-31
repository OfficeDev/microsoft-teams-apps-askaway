process.env.debugMode = "true";
process.env.MicrosoftAppId = "random";
process.env.MicrosoftAppPassword = "placeholderPwd";
process.env.MaxWaitTimeForAdaptiveCardRefreshInMs = 5000;
process.env.AzureSignalRConnectionString = "Endpoint=https://test.service.signalr.net;AccessKey=test=AccessKey=;Version=1.0;";

module.exports = {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/src/tests/**/*[.]test.[t]s?(x)"]
};