// Middleman file to allow for communication between the bot, database, and adaptive card builder.
import { AdaptiveCard } from 'adaptivecards';
import jimp from 'jimp';
import { IConversation, IQnASessionDataService, IQnASession_populated, IQuestion, IQuestionDataService, IQuestionPopulatedUser, SessionIsNoLongerActiveError } from 'msteams-app-questionly.data';
import * as adaptiveCardBuilder from 'src/adaptive-cards/adaptiveCardBuilder'; // To populate adaptive cards
import {
    triggerBackgroundJobForQnaSessionCreatedEvent,
    triggerBackgroundJobForQnaSessionEndedEvent,
    triggerBackgroundJobForQuestionDownvotedEvent,
    triggerBackgroundJobForQuestionMarkedAsAnsweredEvent,
    triggerBackgroundJobForQuestionPostedEvent,
    triggerBackgroundJobForQuestionUpvotedEvent,
} from 'src/background-job/backgroundJobTrigger';
import { ChangesRevertedDueToBackgroundJobFailureError } from 'src/errors/changesRevertedDueToBackgroundJobFailureError';
import { RevertOperationFailedAfterBackgroundJobFailureError } from 'src/errors/revertOperationFailedAfterBackgroundJobFailureError';
import { UnauthorizedAccessError, UnauthorizedAccessErrorCode } from 'src/errors/unauthorizedAccessError';
import { exceptionLogger, trackCreateQnASessionEvent, trackCreateQuestionEvent } from 'src/util/exceptionTracking';
import { isPresenterOrOrganizer } from 'src/util/meetingsUtility';
import { isValidStringParameter } from 'src/util/typeUtility';
import { TelemetryExceptions } from './constants/telemetryConstants';
import { EventInitiator } from 'src/enums/eventInitiator';

export interface IController {
    startQnASession: (sessionParameters: {
        title: string;
        description: string;
        userName: string;
        userAadObjectId: string;
        activityId: string;
        conversationId: string;
        tenantId: string;
        scopeId: string;
        hostUserId: string;
        isChannel: boolean;
        serviceUrl: string;
        caller: EventInitiator;
        meetingId?: string;
    }) => Promise<IQnASession_populated>;
    generateLeaderboard: (qnaSessionId: string, aadObjectId: string, theme: string) => Promise<AdaptiveCard>;
    getNewQuestionCard: (qnaSessionId: string) => AdaptiveCard;
    submitNewQuestion: (
        qnaSessionId: string,
        userAadObjId: string,
        userName: string,
        questionContent: string,
        conversationId: string,
        serviceUrl: string,
        caller: EventInitiator,
        meetingId?: string
    ) => Promise<IQuestion>;
    markQuestionAsAnswered: (
        conversationData: IConversation,
        meetingId: string,
        qnaSessionId: string,
        questionId: string,
        aadObjectId: string,
        serviceUrl: string,
        caller: EventInitiator
    ) => Promise<IQuestionPopulatedUser>;
    upvoteQuestion: (
        conversationId: string,
        qnaSessionId: string,
        questionId: string,
        aadObjectId: string,
        userName: string,
        serviceUrl: string,
        caller: EventInitiator,
        meetingId?: string
    ) => Promise<IQuestionPopulatedUser>;
    downvoteQuestion: (
        conversationId: string,
        qnaSessionId: string,
        questionId: string,
        aadObjectId: string,
        userName: string,
        serviceUrl: string,
        caller: EventInitiator,
        meetingId?: string
    ) => Promise<IQuestionPopulatedUser>;
    updateUpvote: (
        qnaSessionId: string,
        questionId: string,
        aadObjectId: string,
        name: string,
        conversationId: string,
        theme: string,
        serviceUrl: string,
        caller: EventInitiator,
        meetingId?: string
    ) => Promise<AdaptiveCard>;
    getEndQnAConfirmationCard: (qnaSessionId: string) => AdaptiveCard;
    endQnASession: (sessionParameters: {
        qnaSessionId: string;
        aadObjectId: string;
        conversationId: string;
        tenantId: string;
        serviceURL: string;
        userName: string;
        endedByUserId: string;
        caller: EventInitiator;
        meetingId?: string;
    }) => Promise<void>;
    getResubmitQuestionCard: (qnaSessionId: string, questionContent: string) => AdaptiveCard;
    isHost: (qnaSessionId: string, userAadObjId: string) => Promise<boolean>;
    generateInitialsImage: (initials: string, index: number) => Promise<jimp>;
    validateConversationId: (qnaSessionId: string, conversationId: string) => Promise<boolean>;
    isActiveQnA: (qnaSessionId: string) => Promise<boolean>;
}

export class Controller implements IController {
    private questionDataService: IQuestionDataService;
    private qnaSessionDataService: IQnASessionDataService;

    // color pallete used for user avatars
    private avatarColors: string[] = ['#B3DBF2', '#A7CFE8', '#92E0EA', '#ABDDD3', '#F7B189', '#EE9889', '#EEC7C2', '#FAC1B4', '#FFB8C6', '#D8A3D8', '#BBB0D6', '#B4A0FF', '#AAE5AA', '#E6EDC0'];

    constructor(questionDataService: IQuestionDataService, qnaSessionDataService: IQnASessionDataService) {
        this.questionDataService = questionDataService;
        this.qnaSessionDataService = qnaSessionDataService;
    }

    /**
     * Starts the QnA session
     * @param sessionParameters - object with parameters needed in order to create a session
     * title - title of QnA
     * description - description of QnA
     * userName - name of the user who created the QnA
     * userAadObjId - AAD Object Id of the suer who created the QnA
     * activityId - id of the master card message used for proactive updating
     * tenantId - id of tenant the bot is running on.
     * scopeId - channel id or group chat id
     * hostUserId - MS Teams Id of user who created the QnA (used for at-mentions)
     * isChannel - whether the QnA session was started in a channel or group chat
     * serviceUrl - bot service url.
     * caller - event initiator (card/ Rest API)
     * meetingId - meeting id.
     * @returns qna session document.
     */
    public startQnASession = async (sessionParameters: {
        title: string;
        description: string;
        userName: string;
        userAadObjectId: string;
        activityId: string;
        conversationId: string;
        tenantId: string;
        scopeId: string;
        hostUserId: string;
        isChannel: boolean;
        serviceUrl: string;
        caller: EventInitiator;
        meetingId?: string;
    }): Promise<IQnASession_populated> => {
        const isMeetingGroupChat = isValidStringParameter(sessionParameters.meetingId);

        // Only a presenter or organizer can create a new QnA session in the meeting.

        if (
            isMeetingGroupChat &&
            !(await isPresenterOrOrganizer(
                // `isMeetingGroupChat` makes sure that meetingId is valid.
                <string>sessionParameters.meetingId,
                sessionParameters.userAadObjectId,
                sessionParameters.tenantId,
                sessionParameters.serviceUrl
            ))
        ) {
            throw new UnauthorizedAccessError(UnauthorizedAccessErrorCode.InsufficientPermissionsToCreateOrEndQnASession);
        }

        // save data to db
        const response = await this.qnaSessionDataService.createQnASession({
            title: sessionParameters.title,
            description: sessionParameters.description,
            userName: sessionParameters.userName,
            userAadObjectId: sessionParameters.userAadObjectId,
            activityId: sessionParameters.activityId,
            conversationId: sessionParameters.conversationId,
            tenantId: sessionParameters.tenantId,
            scopeId: sessionParameters.scopeId,
            hostUserId: sessionParameters.hostUserId,
            isChannel: sessionParameters.isChannel,
            isMeetingGroupChat: isMeetingGroupChat,
        });

        if (await triggerBackgroundJobForQnaSessionCreatedEvent(response, sessionParameters.serviceUrl, sessionParameters.caller, sessionParameters.meetingId)) {
            trackCreateQnASessionEvent({
                qnaSessionId: response?._id,
                tenantId: sessionParameters.tenantId,
                hostUserId: sessionParameters.hostUserId,
                isChannel: sessionParameters.isChannel,
                meetingId: sessionParameters.meetingId,
                conversationId: sessionParameters.conversationId,
                sessionTitle: sessionParameters.title,
            });

            return response;
        } else {
            try {
                // Revert changes if there is an error in triggering background job, as the card won't get posted and clients won't get event.
                await this.qnaSessionDataService.deleteQnASession(response._id);
            } catch (error) {
                exceptionLogger(error, {
                    message: `Failure in reverting created session after background job failure. session id ${response?._id}`,
                    qnaSessionId: response?._id,
                    exceptionName: TelemetryExceptions.RevertOperationFailedAfterBackgroundJobFailure,
                });
                throw new RevertOperationFailedAfterBackgroundJobFailureError(`Failure in reverting created session after background job failure. session id ${response?._id}`);
            }

            throw new ChangesRevertedDueToBackgroundJobFailureError();
        }
    };

    /**
     * Returns the populated leaderboard adaptive card for the QnA session attached to the id provided.
     * @param qnaSessionId - ID of the QnA session for which the leaderboard shouold be retrieived.
     * @param aadObjectId - aadObjectId of the user who is trying view the leaderboard. This is to used to control certain factors such as not letting the user upvote their own questions.
     * @returns - A promise containing a result object which, on success, contains the populated leaderboard adaptive card, and on failure, contains an error card.
     */
    public generateLeaderboard = async (qnaSessionId: string, aadObjectId: string, theme: string): Promise<AdaptiveCard> => {
        try {
            const questionData: IQuestionPopulatedUser[] = await this.questionDataService.getAllQuestions(qnaSessionId);
            const isHost = await this.qnaSessionDataService.isHost(qnaSessionId, aadObjectId);
            const isActiveQnA = await this.qnaSessionDataService.isActiveQnA(qnaSessionId);
            return await adaptiveCardBuilder.generateLeaderboard(questionData, aadObjectId, qnaSessionId, isHost, isActiveQnA, theme);
        } catch (error) {
            exceptionLogger(error);
            throw new Error('Retrieving Leaderboard Failed.');
        }
    };

    /**
     * Calls adaptiveCardbuilder to get the newQuestionCard.
     * @returns Adaptive Card associated with creating a new question
     */
    public getNewQuestionCard = (qnaSessionId: string): AdaptiveCard => {
        return adaptiveCardBuilder.getNewQuestionCard(qnaSessionId);
    };

    /**
     * If any of the QnA session operation throws error as the session is no more active, there is a probability that the
     * adaptive card/ client app is not up to date with latest session state. Hence trigger bakground job for session ended event.
     * @param error - error occured during session updatation.
     * @param conversationId - conversation id of chat in which the session is created.
     * @param sessionId - session id.
     * @param serviceUrl - service url.
     * @param meetingId - meeting id.
     * @param caller - event initiator (main card/ rest api)
     * @throws - this method should not throw any errors or exception as it is called from the error flows.
     */
    private handleOperationFailureForEndedSession = (error: any, conversationId: string, sessionId: string, serviceUrl: string, caller: EventInitiator, meetingId?: string) => {
        try {
            if (error instanceof SessionIsNoLongerActiveError) {
                triggerBackgroundJobForQnaSessionEndedEvent(conversationId, sessionId, serviceUrl, caller, meetingId);
            }
        } catch (error) {
            exceptionLogger(error, {
                conversationId: conversationId,
                qnaSessionId: sessionId,
                meetingId: meetingId,
                filename: module?.id,
            });
        }
    };

    /**
     * Handles and formats the parameters, then sends new question details to the database.
     * Also triggers backgorund job.
     * @param qnaSessionId - id of the current QnA session
     * @param userAadObjId - AAD Obj ID of the current user
     * @param userName - name of the user
     * @param questionContent - question content asked by the user
     * @param conversationId - conversation id.
     * @param serviceUrl - bot service url.
     * @param caller - event initiator (main card/ rest api)
     * @param meetingId - meeting id.
     * @returns Returns ok object if successful, otherwise returns error
     */
    public submitNewQuestion = async (
        qnaSessionId: string,
        userAadObjId: string,
        userName: string,
        questionContent: string,
        conversationId: string,
        serviceUrl: string,
        caller: EventInitiator,
        meetingId?: string
    ): Promise<IQuestion> => {
        try {
            const question = await this.questionDataService.createQuestion(qnaSessionId, userAadObjId, userName, questionContent, conversationId);

            if (await triggerBackgroundJobForQuestionPostedEvent(conversationId, question, qnaSessionId, userAadObjId, serviceUrl, caller, meetingId)) {
                trackCreateQuestionEvent({ questionId: question?._id, qnaSessionId: qnaSessionId, conversationId: conversationId, questionContent: questionContent });
                return question;
            } else {
                try {
                    // Revert changes if there is an error in triggering background job, as the card won't get updated and clients won't get event.
                    await this.questionDataService.deleteQuestion(question._id);
                } catch (error) {
                    exceptionLogger(error, {
                        message: `Failure in reverting posted question after background job failure. question id ${question?._id}`,
                        questionId: question?._id,
                        exceptionName: TelemetryExceptions.RevertOperationFailedAfterBackgroundJobFailure,
                    });
                    throw new RevertOperationFailedAfterBackgroundJobFailureError(`Failure in reverting posted question after background job failure. question id ${question?._id}`);
                }

                throw new ChangesRevertedDueToBackgroundJobFailureError();
            }
        } catch (error) {
            this.handleOperationFailureForEndedSession(error, conversationId, qnaSessionId, serviceUrl, caller, meetingId);
            throw error;
        }
    };

    /**
     * Marks question as answered and triggers background job.
     * @param conversationData - conversation document.
     * @param meetingId - meeting id.
     * @param qnaSessionId - qnasession id.
     * @param questionId - question id.
     * @param aadObjectId - aad object id of user who marked question as answered.
     * @param serviceUrl - bot service url.
     * @param caller - event initiator (main card/ rest api)
     * @returns - question document.
     */
    public markQuestionAsAnswered = async (
        conversationData: IConversation,
        meetingId: string,
        qnaSessionId: string,
        questionId: string,
        aadObjectId: string,
        serviceUrl: string,
        caller: EventInitiator
    ): Promise<IQuestionPopulatedUser> => {
        try {
            if (await isPresenterOrOrganizer(meetingId, aadObjectId, conversationData.tenantId, conversationData.serviceUrl)) {
                const questionData = await this.questionDataService.markQuestionAsAnswered(conversationData._id, qnaSessionId, questionId);

                if (await triggerBackgroundJobForQuestionMarkedAsAnsweredEvent(conversationData._id, questionId, qnaSessionId, aadObjectId, serviceUrl, caller, meetingId)) {
                    return questionData;
                } else {
                    try {
                        // Revert changes if there is an error in triggering background job, as clients won't get event.
                        await this.questionDataService.markQuestionAsUnanswered(questionId);
                    } catch (error) {
                        exceptionLogger(error, {
                            message: `Failure in marking question as unanswered after background job failure. question id ${questionData?._id}`,
                            questionId: questionData?._id,
                            exceptionName: TelemetryExceptions.RevertOperationFailedAfterBackgroundJobFailure,
                        });
                        throw new RevertOperationFailedAfterBackgroundJobFailureError(`Failure in marking question as unanswered after background job failure. question id ${questionData?._id}`);
                    }
                    throw new ChangesRevertedDueToBackgroundJobFailureError();
                }
            } else {
                throw new UnauthorizedAccessError(UnauthorizedAccessErrorCode.InsufficientPermissionsToMarkQuestionAsAnswered);
            }
        } catch (error) {
            this.handleOperationFailureForEndedSession(error, conversationData._id, qnaSessionId, serviceUrl, caller, meetingId);
            throw error;
        }
    };

    /**
     * upvotes question and triggers background job.
     * @param conversationId - conversation id.
     * @param qnaSessionId - qnasession id.
     * @param questionId - question id.
     * @param aadObjectId - aad object id of user who upvoted question.
     * @param userName - name of user who upvoted the question.
     * @param serviceUrl - bot service url.
     * @param caller - event initiator (main card/ rest api)
     * @param meetingId - meeting id.
     * @returns - question document.
     */
    public upvoteQuestion = async (
        conversationId: string,
        qnaSessionId: string,
        questionId: string,
        aadObjectId: string,
        userName: string,
        serviceUrl: string,
        caller: EventInitiator,
        meetingId?: string
    ): Promise<IQuestionPopulatedUser> => {
        try {
            const questionData = await this.questionDataService.upVoteQuestion(conversationId, qnaSessionId, questionId, aadObjectId, userName);

            if (await triggerBackgroundJobForQuestionUpvotedEvent(conversationId, questionId, qnaSessionId, aadObjectId, serviceUrl, caller, meetingId)) {
                return questionData;
            } else {
                try {
                    // Revert changes if there is an error in triggering background job, as the card won't get updated and clients won't get event.
                    await this.questionDataService.downVoteQuestion(conversationId, qnaSessionId, questionId, aadObjectId);
                } catch (error) {
                    exceptionLogger(error, {
                        message: `Failure in down voting question after background job failure. question id ${questionData?._id}, userId ${aadObjectId}`,
                        questionId: questionData?._id,
                        exceptionName: TelemetryExceptions.RevertOperationFailedAfterBackgroundJobFailure,
                    });
                    throw new RevertOperationFailedAfterBackgroundJobFailureError(
                        `Failure in down voting question after background job failure. question id ${questionData?._id}, userId ${aadObjectId}`
                    );
                }
                throw new ChangesRevertedDueToBackgroundJobFailureError();
            }
        } catch (error) {
            this.handleOperationFailureForEndedSession(error, conversationId, qnaSessionId, serviceUrl, caller, meetingId);
            throw error;
        }
    };

    /**
     * downvotes question and triggers background job.
     * @param conversationId - conversation id.
     * @param qnaSessionId - qnasession id.
     * @param questionId - question id.
     * @param aadObjectId - aad object id of user who downvoted question.
     * @param serviceUrl - bot service url.
     * @param userName - name of user who upvoted the question.
     * @param caller - event initiator (main card/ rest api)
     * @param meetingId - meeting id.
     * @returns - question document.
     */
    public downvoteQuestion = async (
        conversationId: string,
        qnaSessionId: string,
        questionId: string,
        aadObjectId: string,
        userName: string,
        serviceUrl: string,
        caller: EventInitiator,
        meetingId?: string
    ): Promise<IQuestionPopulatedUser> => {
        try {
            const questionData = await this.questionDataService.downVoteQuestion(conversationId, qnaSessionId, questionId, aadObjectId);

            if (await triggerBackgroundJobForQuestionDownvotedEvent(conversationId, questionId, qnaSessionId, aadObjectId, serviceUrl, caller, meetingId)) {
                return questionData;
            } else {
                try {
                    // Revert changes if there is an error in triggering background job, as the card won't get updated and clients won't get event.
                    await this.questionDataService.upVoteQuestion(conversationId, qnaSessionId, questionId, aadObjectId, userName);
                } catch (error) {
                    exceptionLogger(error, {
                        message: `Failure in up voting question after background job failure. question id ${questionData?._id}, userId ${aadObjectId}`,
                        questionId: questionData?._id,
                        exceptionName: TelemetryExceptions.RevertOperationFailedAfterBackgroundJobFailure,
                    });
                    throw new RevertOperationFailedAfterBackgroundJobFailureError(
                        `Failure in up voting question after background job failure. question id ${questionData?._id}, userId ${aadObjectId}`
                    );
                }
                throw new ChangesRevertedDueToBackgroundJobFailureError();
            }
        } catch (error) {
            this.handleOperationFailureForEndedSession(error, conversationId, qnaSessionId, serviceUrl, caller, meetingId);
            throw error;
        }
    };

    /**
     * Upvotes a question and returns an updated leaderboard
     * @param questionId - DBID of the question being upvoted
     * @param aadObjectId - aadObjectId of the user upvoting the question
     * @param name - Name of the user upvoting the question
     * @param theme - Teams theme of the user upvoting. Options are 'default', 'dark', or 'high-contrast'
     * @param serviceUrl - bot service url.
     * @param caller - event initiator (main card/ rest api)
     * @param meetingId - meeting id.
     */
    public updateUpvote = async (
        qnaSessionId: string,
        questionId: string,
        aadObjectId: string,
        name: string,
        conversationId: string,
        theme: string,
        serviceUrl: string,
        caller: EventInitiator,
        meetingId?: string
    ): Promise<AdaptiveCard> => {
        try {
            const response = await this.questionDataService.updateUpvote(conversationId, qnaSessionId, questionId, aadObjectId, name);
            let backgroundJobStatus: boolean;

            if (response.upvoted) {
                backgroundJobStatus = await triggerBackgroundJobForQuestionUpvotedEvent(conversationId, response.question._id, qnaSessionId, aadObjectId, serviceUrl, caller, meetingId);
            } else {
                backgroundJobStatus = await triggerBackgroundJobForQuestionDownvotedEvent(conversationId, response.question._id, qnaSessionId, aadObjectId, serviceUrl, caller, meetingId);
            }

            if (!backgroundJobStatus) {
                try {
                    // Revert changes if there is an error in triggering background job, as the card won't get updated and clients won't get event.
                    await this.questionDataService.updateUpvote(conversationId, qnaSessionId, questionId, aadObjectId, name);
                } catch (error) {
                    exceptionLogger(error, {
                        message: `Failure in updating vote for a question after background job failure. question id ${response?.question?._id}, userId ${aadObjectId}`,
                        questionId: questionId,
                        exceptionName: TelemetryExceptions.RevertOperationFailedAfterBackgroundJobFailure,
                    });
                    throw new RevertOperationFailedAfterBackgroundJobFailureError(
                        `Failure in updating vote for a question after background job failure. question id ${response?.question?._id}, userId ${aadObjectId}`
                    );
                }

                throw new ChangesRevertedDueToBackgroundJobFailureError();
            }

            return this.generateLeaderboard(response.question.qnaSessionId, aadObjectId, theme);
        } catch (error) {
            this.handleOperationFailureForEndedSession(error, conversationId, qnaSessionId, serviceUrl, caller, meetingId);
            throw error;
        }
    };

    /*
     * Calls adaptiveCardBuilder to get the endQnAConfirmationCard.
     * @param qnaSessionId - id of the current QnA session
     * @returns Adaptive Card associated with confirming the ending of an QnA
     */
    public getEndQnAConfirmationCard = (qnaSessionId: string): AdaptiveCard => {
        return adaptiveCardBuilder.getEndQnAConfirmationCard(qnaSessionId);
    };

    /**
     * Communicates with database to end the QnA and retrieves details
     * @param sessionParameters - object with parameters needed in order to end a session
     * qnaSessionId - id of the current QnA session
     * aadObjectId - aadObjectId of the user attempting to end the QnA session
     * conversationId - conversation id
     * tenantId - tenant id
     * serviceURL - bot service url
     * endedByUserId - aad object id of user who is ending the session
     * caller - event initiator (main card/ rest api)
     * meetingId - meeting id
     */
    public endQnASession = async (sessionParameters: {
        qnaSessionId: string;
        aadObjectId: string;
        conversationId: string;
        tenantId: string;
        serviceURL: string;
        userName: string;
        endedByUserId: string;
        caller: EventInitiator;
        meetingId?: string;
    }): Promise<void> => {
        try {
            //Only a Presenter or an Organizer can end QnA session in the meeting.
            if (sessionParameters.meetingId) {
                const canEndQnASession = await isPresenterOrOrganizer(sessionParameters.meetingId, sessionParameters.aadObjectId, sessionParameters.tenantId, sessionParameters.serviceURL);

                if (!canEndQnASession) {
                    throw new UnauthorizedAccessError(UnauthorizedAccessErrorCode.InsufficientPermissionsToCreateOrEndQnASession);
                }
            } else {
                const isHost = await this.qnaSessionDataService.isHost(sessionParameters.qnaSessionId, sessionParameters.aadObjectId);

                if (!isHost) {
                    throw new Error('Insufficient permissions to end QnA session');
                }
            }

            await this.qnaSessionDataService.endQnASession(
                sessionParameters.qnaSessionId,
                sessionParameters.conversationId,
                sessionParameters.aadObjectId,
                sessionParameters.userName,
                sessionParameters.endedByUserId
            );

            if (
                !(await triggerBackgroundJobForQnaSessionEndedEvent(
                    sessionParameters.conversationId,
                    sessionParameters.qnaSessionId,
                    sessionParameters.serviceURL,
                    sessionParameters.caller,
                    sessionParameters.meetingId
                ))
            ) {
                try {
                    // Revert changes if there is an error in triggering background job, as the card won't get updated and clients won't get event.
                    await this.qnaSessionDataService.activateQnASession(sessionParameters.qnaSessionId);
                } catch (error) {
                    exceptionLogger(error, {
                        message: `Failure in reactivating a session after background job failure. session id id ${sessionParameters.qnaSessionId}`,
                        qnaSessionId: sessionParameters.qnaSessionId,
                        exceptionName: TelemetryExceptions.RevertOperationFailedAfterBackgroundJobFailure,
                    });
                    throw new RevertOperationFailedAfterBackgroundJobFailureError(`Failure in reactivating a session after background job failure. session id id ${sessionParameters.qnaSessionId}`);
                }

                throw new ChangesRevertedDueToBackgroundJobFailureError();
            }
        } catch (error) {
            this.handleOperationFailureForEndedSession(
                error,
                sessionParameters.conversationId,
                sessionParameters.qnaSessionId,
                sessionParameters.serviceURL,
                sessionParameters.caller,
                sessionParameters.meetingId
            );
            throw error;
        }
    };

    /**
     * Calls adaptiveCardBuilder to get resubmitQuestionCard.
     * @param qnaSessionId - id of the current QnA session
     * @param questionContent - question asked that failed to save when error occured
     * @returns Adaptive Card with question asked in text box
     */
    public getResubmitQuestionCard = (qnaSessionId: string, questionContent: string): AdaptiveCard => {
        return adaptiveCardBuilder.getResubmitQuestionErrorCard(qnaSessionId, questionContent);
    };

    /**
     * Calls database to check if specified user is the host for the current QnA session
     * @param qnaSessionId - id of the current QnA session
     * @param userAadObjId - aadObjId of the current user
     */
    public isHost = async (qnaSessionId: string, userAadObjId: string): Promise<boolean> => {
        try {
            return await this.qnaSessionDataService.isHost(qnaSessionId, userAadObjId);
        } catch (error) {
            exceptionLogger(error);
            throw new Error('Failed to check if user is host for this QnA session');
        }
    };

    /**
     * Generate 256px * 256px avatar with provided initials and the background color set to the color of the provided index of the color pallete.
     * @param initials - initials of the user the avatar is being generated for
     * @param index - index of the color to use from the color pallete. Integer from 0 to 13
     * @returns - An instance of a jimp object. This object has methods to convert to a file, a buffered stream, or other formats such as base64
     */
    public generateInitialsImage = async (initials: string, index: number): Promise<jimp> => {
        const image = new jimp(52, 52, this.avatarColors[index]);
        const font = await jimp.loadFont(jimp.FONT_SANS_16_WHITE);
        return image.print(
            font,
            0,
            0,
            {
                text: initials,
                alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: jimp.VERTICAL_ALIGN_MIDDLE,
            },
            52,
            52
        );
    };

    /**
     * Function to validate that the request coming from a client is from the same conversation as the QnA session the request is pertaining to.
     * @param qnaSessionId - qnaSessionId of the QnA session that the request pertains to
     * @param conversationId - conversationId of the conversation the incoming request is coming from
     * @returns - boolean indicating whether the request is coming from the same conversation as the QnA session the request is pertaining to.
     */
    public validateConversationId = async (qnaSessionId: string, conversationId: string): Promise<boolean> => {
        try {
            const qnaSessionData = await this.qnaSessionDataService.getQnASessionData(qnaSessionId);
            return qnaSessionData.conversationId.split(';')[0] === conversationId.split(';')[0];
        } catch (error) {
            exceptionLogger(error);
            throw new Error('Unable to validate conversationId of incoming request');
        }
    };

    /**
     * Calls database to check if current QnA session is active
     * @param qnaSessionId - id of the current QnA session
     */
    public isActiveQnA = async (qnaSessionId: string): Promise<boolean> => {
        try {
            return await this.qnaSessionDataService.isActiveQnA(qnaSessionId);
        } catch (error) {
            exceptionLogger(error);
            throw new Error('Failed to check if QnA session is active');
        }
    };
}
