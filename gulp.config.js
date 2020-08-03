const config = {
    manifests: [
        "./src/manifest/**/*.*",
        '!**/manifest.json'
    ],
    temp: [
        "./temp"
    ],
    watches: [
        "./src/**/*.*",
    ],
    // Supported Schemas
    SCHEMAS: [{
        version: "1.3",
        schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.3/MicrosoftTeams.schema.json"
    },
    {
        version: "1.4",
        schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.4/MicrosoftTeams.schema.json"
    },
    {
        version: "devPreview",
        schema: "https://raw.githubusercontent.com/OfficeDev/microsoft-teams-app-schema/preview/DevPreview/MicrosoftTeams.schema.json"
    },
    {
        version: "1.5",
        schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.5/MicrosoftTeams.schema.json"
    },
    {
        version: "1.6",
        schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.6/MicrosoftTeams.schema.json"
    }
    ],
    // This is the name of the packaged manifest file
    manifestFileName: "AskAway.zip"
};

module.exports = config;