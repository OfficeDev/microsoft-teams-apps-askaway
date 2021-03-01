/**
 * List of events that are logged at server-side.
 */
export const TelemetryEvents = {
    CreateQnASessionEvent: 'QnASessionCreated',
    CreateQuestionEvent: 'QuestionCreated',
    BackgroundFunctionTriggerEvent: 'BackgroundFunctionTriggerEvent',
    SignalREventReceived: 'SignalREventReceived',
};

/**
 * List of user invoked flows for which error is logged.
 */
export const TelemetryExceptions = {
    CreateQnASessionFailed: 'CreateQnASessionFailed',
    EndQnASessionFailed: 'EndQnASessionFailed',
    CreateQuestionFailed: 'CreateQuestionFailed',
    VoteQuestionFailed: 'VoteQuestionFailed',
    ConversationValidationFailed: 'ConversationValidationFailed',
    ViewLeaderboardFailed: 'ViewLeaderboardFailed',
    TriggerBackgroundJobFailed: 'TriggerBackgroundJobFailed',
    RestApiCallFailed: 'RestApiCallFailed',
    GetParticipantRoleFailed: 'GetParticipantRoleFailed',
    GetTeamsMemberIdFailed: 'GetTeamsMemberIdFailed',
    ApplicationStartUpFailed: 'ApplicationStartUpFailed',
    SetUpBotFailed: 'SetUpBotFailed',
    RevertOperationFailedAfterBackgroundJobFailure: 'RevertOperationFailedAfterBackgroundJobFailure',
};
