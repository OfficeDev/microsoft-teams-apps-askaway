process.env.debugMode = "true";

module.exports = {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/src/tests/**/*[.]test.[t]s?(x)"]
};