process.env.debugMode = "true";
process.env.MicrosoftAppId = "random";
process.env.MicrosoftAppPassword = "placeholderPwd";
process.env.MaxWaitTimeForAdaptiveCardRefreshInMs = 5000;

module.exports = {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/src/tests/**/*[.]test.[t]s?(x)"]
};