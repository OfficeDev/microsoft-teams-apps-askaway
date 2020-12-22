// Middleman file to allow for communication between the bot, database, and adaptive card builder.
import * as adaptiveCardBuilder from 'src/adaptive-cards/adaptiveCardBuilder'; // To populate adaptive cards
import { AdaptiveCard } from 'adaptivecards';
import { exceptionLogger, trackCreateQnASessionEvent, trackCreateQuestionEvent } from 'src/util/exceptionTracking';
import jimp from 'jimp';
import { join } from 'path';
import {
    IQuestion,
    IQuestionPopulatedUser,
    qnaSessionDataService,
    questionDataService,
    IQnASession_populated,
    IConversation,
} from 'msteams-app-questionly.data';
import { isPresenterOrOrganizer } from 'src/util/meetingsUtility';
import {
    UnauthorizedAccessError,
    UnauthorizedAccessErrorCode,
} from 'src/errors/unauthorizedAccessError';
import {
    triggerBackgroundJobForQnaSessionCreatedEvent,
    triggerBackgroundJobForQnaSessionEndedEvent,
    triggerBackgroundJobForQuestionDownvotedEvent,
    triggerBackgroundJobForQuestionMarkedAsAnsweredEvent,
    triggerBackgroundJobForQuestionPostedEvent,
    triggerBackgroundJobForQuestionUpvotedEvent,
} from 'src/background-job/backgroundJobTrigger';

export const getMainCard = adaptiveCardBuilder.getMainCard;
export const getStartQnACard = adaptiveCardBuilder.getStartQnACard;
export const getErrorCard = adaptiveCardBuilder.getErrorCard;

// color pallete used for user avatars
const avatarColors: string[] = [
    '#B3DBF2',
    '#A7CFE8',
    '#92E0EA',
    '#ABDDD3',
    '#F7B189',
    '#EE9889',
    '#EEC7C2',
    '#FAC1B4',
    '#FFB8C6',
    '#D8A3D8',
    '#BBB0D6',
    '#B4A0FF',
    '#AAE5AA',
    '#E6EDC0',
];

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
 * @returns qna session document.
 */
export const startQnASession = async (sessionParameters: {
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
    meetingId: string;
}): Promise<IQnASession_populated> => {
    // Only a presenter or organizer can create a new QnA session in the meeting.
    if (sessionParameters.meetingId) {
        if (
            !(await isPresenterOrOrganizer(
                sessionParameters.meetingId,
                sessionParameters.userAadObjectId,
                sessionParameters.tenantId,
                sessionParameters.serviceUrl
            ))
        ) {
            throw new UnauthorizedAccessError(
                UnauthorizedAccessErrorCode.InsufficientPermissionsToCreateOrEndQnASession
            );
        }
    }

    // save data to db
    const response = await qnaSessionDataService.createQnASession({
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
    });

    trackCreateQnASessionEvent({
        qnaSessionId: response?._id,
        tenantId: tenantId,
        hostUserId: hostUserId,
        isChannel: isChannel,
        meetingId: meetingId,
        conversationId: conversationId,
        title: title
    });

    await triggerBackgroundJobForQnaSessionCreatedEvent(response);

    return response;
};

/**
 * Returns the populated leaderboard adaptive card for the QnA session attached to the id provided.
 * @param qnaSessionId - ID of the QnA session for which the leaderboard shouold be retrieived.
 * @param aadObjectId - aadObjectId of the user who is trying view the leaderboard. This is to used to control certain factors such as not letting the user upvote their own questions.
 * @returns - A promise containing a result object which, on success, contains the populated leaderboard adaptive card, and on failure, contains an error card.
 */
export const generateLeaderboard = async (
    qnaSessionId: string,
    aadObjectId: string,
    theme: string
): Promise<AdaptiveCard> => {
    try {
        const questionData: IQuestionPopulatedUser[] = await questionDataService.getQuestionData(
            qnaSessionId
        );
        const isHost = await qnaSessionDataService.isHost(
            qnaSessionId,
            aadObjectId
        );
        const isActiveQnA = await qnaSessionDataService.isActiveQnA(
            qnaSessionId
        );
        return await adaptiveCardBuilder.generateLeaderboard(
            questionData,
            aadObjectId,
            qnaSessionId,
            isHost,
            isActiveQnA,
            theme
        );
    } catch (error) {
        exceptionLogger(error);
        throw new Error('Retrieving Leaderboard Failed.');
    }
};

/**
 * Sets the activity id of an existing QnA session
 * @param qnaSessionId - document database id of the QnA session
 * @param activityId - id of the master card message used for proactive updating of the card
 */
export const setActivityId = async (
    qnaSessionId: string,
    activityId: string
) => {
    try {
        await qnaSessionDataService.updateActivityId(qnaSessionId, activityId);
    } catch (error) {
        exceptionLogger(error);
        throw error;
    }
};

/**
 * Calls adaptiveCardbuilder to get the newQuestionCard.
 * @returns Adaptive Card associated with creating a new question
 */
export const getNewQuestionCard = (qnaSessionId: string): AdaptiveCard => {
    return adaptiveCardBuilder.getNewQuestionCard(qnaSessionId);
};

/**
 * Handles and formats the parameters, then sends new question details to the database.
 * Also triggers backgorund job.
 * @param qnaSessionId - id of the current QnA session
 * @param userAadObjId - AAD Obj ID of the current user
 * @param userName - name of the user
 * @param questionContent - question content asked by the user
 * @param conversationId - conversation id.
 * @returns Returns ok object if successful, otherwise returns error
 */
export const submitNewQuestion = async (
    qnaSessionId: string,
    userAadObjId: string,
    userName: string,
    questionContent: string,
    conversationId: string
): Promise<IQuestion> => {
    try {
        const question: IQuestion = await questionDataService.createQuestion(
            qnaSessionId,
            <string>userAadObjId,
            userName,
            questionContent,
            conversationId
        );

        trackCreateQuestionEvent({
            questionId: question?._id,
            qnaSessionId: qnaSessionId,
            conversationId: conversationId,
            questionContent: questionContent
        });

        triggerBackgroundJobForQuestionPostedEvent(
            conversationId,
            question,
            qnaSessionId,
            userAadObjId
        );

        return question;
    } catch (error) {
        exceptionLogger(error);
        throw new Error('Failed to submit new question');
    }
};

/**
 * Marks question as answered and triggers background job.
 * @param conversationData - conversation document.
 * @param meetingId - meeting id.
 * @param qnaSessionId - qnasession id.
 * @param questionId - question id.
 * @param aadObjectId - aad object id of user who marked question as answered.
 */
export const markQuestionAsAnswered = async (
    conversationData: IConversation,
    meetingId: string,
    qnaSessionId: string,
    questionId: string,
    aadObjectId: string
) => {
    if (
        await isPresenterOrOrganizer(
            meetingId,
            aadObjectId,
            conversationData.tenantId,
            conversationData.serviceUrl
        )
    ) {
        await questionDataService.markQuestionAsAnswered(
            conversationData._id,
            qnaSessionId,
            questionId
        );

        await triggerBackgroundJobForQuestionMarkedAsAnsweredEvent(
            conversationData._id,
            questionId,
            qnaSessionId,
            aadObjectId
        );
    } else {
        throw new UnauthorizedAccessError(
            UnauthorizedAccessErrorCode.InsufficientPermissionsToMarkQuestionAsAnswered
        );
    }
};

/**
 * upvotes question and triggers background job.
 * @param conversationId - conversation id.
 * @param qnaSessionId - qnasession id.
 * @param questionId - question id.
 * @param aadObjectId - aad object id of user who upvoted question.
 * @param userName - name of user who upvoted the question.
 */
export const upvoteQuestion = async (
    conversationId: string,
    qnaSessionId: string,
    questionId: string,
    aadObjectId: string,
    userName: string
) => {
    await questionDataService.upVoteQuestion(
        conversationId,
        qnaSessionId,
        questionId,
        aadObjectId,
        userName
    );

    await triggerBackgroundJobForQuestionUpvotedEvent(
        conversationId,
        questionId,
        qnaSessionId,
        aadObjectId
    );
};

/**
 * downvotes question and triggers background job.
 * @param conversationId - conversation id.
 * @param qnaSessionId - qnasession id.
 * @param questionId - question id.
 * @param aadObjectId - aad object id of user who downvoted question.
 */
export const downvoteQuestion = async (
    conversationId: string,
    qnaSessionId: string,
    questionId: string,
    aadObjectId: string
) => {
    await questionDataService.downVoteQuestion(
        conversationId,
        qnaSessionId,
        questionId,
        aadObjectId
    );

    await triggerBackgroundJobForQuestionDownvotedEvent(
        conversationId,
        questionId,
        qnaSessionId,
        aadObjectId
    );
};

/**
 * Upvotes a question and returns an updated leaderboard
 * @param questionId - DBID of the question being upvoted
 * @param aadObjectId - aadObjectId of the user upvoting the question
 * @param name - Name of the user upvoting the question
 * @param theme - Teams theme of the user upvoting. Options are 'default', 'dark', or 'high-contrast'
 */
export const updateUpvote = async (
    qnaSessionId: string,
    questionId: string,
    aadObjectId: string,
    name: string,
    conversationId: string,
    theme: string
): Promise<AdaptiveCard> => {
    try {
        const response = await questionDataService.updateUpvote(
            questionId,
            aadObjectId,
            name
        );

        if (response.upvoted) {
            await triggerBackgroundJobForQuestionUpvotedEvent(
                conversationId,
                response.question._id,
                qnaSessionId,
                aadObjectId
            );
        } else {
            await triggerBackgroundJobForQuestionDownvotedEvent(
                conversationId,
                response.question._id,
                qnaSessionId,
                aadObjectId
            );
        }

        return generateLeaderboard(
            response.question.qnaSessionId,
            aadObjectId,
            theme
        );
    } catch (error) {
        exceptionLogger(error);
        throw new Error('Failed to upvote question.');
    }
};

/*
 * Calls adaptiveCardBuilder to get the endQnAConfirmationCard.
 * @param qnaSessionId - id of the current QnA session
 * @returns Adaptive Card associated with confirming the ending of an QnA
 */
export const getEndQnAConfirmationCard = (
    qnaSessionId: string
): AdaptiveCard => {
    return adaptiveCardBuilder.getEndQnAConfirmationCard(qnaSessionId);
};

/**
 * Communicates with database to end the QnA and retrieves details
 * @param qnaSessionId - id of the current QnA session
 * @param aadObjectId - aadObjectId of the user attempting to end the QnA session
 * @param conversationId - conversation id
 * @returns Ok object with updated Master Card
 */
export const endQnASession = async (
    qnaSessionId: string,
    aadObjectId: string,
    conversationId: string,
    tenantId: string,
    serviceURL: string,
    meetingId: string
): Promise<void> => {
    const isActive = await qnaSessionDataService.isActiveQnA(qnaSessionId);
    if (!isActive) {
        throw new Error('The QnA session has already ended');
    }

    const isHost = await qnaSessionDataService.isHost(
        qnaSessionId,
        aadObjectId
    );

    //Only a Presenter or an Organizer can end QnA session in the meeting.
    if (meetingId) {
        const canEndQnASession = await isPresenterOrOrganizer(
            meetingId,
            aadObjectId,
            tenantId,
            serviceURL
        );
        if (!canEndQnASession) {
            throw new UnauthorizedAccessError(
                UnauthorizedAccessErrorCode.InsufficientPermissionsToCreateOrEndQnASession
            );
        }
    } else {
        if (!isHost) {
            throw new Error('Insufficient permissions to end QnA session');
        }
    }

    await qnaSessionDataService.endQnASession(qnaSessionId, conversationId);

    await triggerBackgroundJobForQnaSessionEndedEvent(
        conversationId,
        qnaSessionId,
        aadObjectId
    );
};

/**
 * Calls adaptiveCardBuilder to get resubmitQuestionCard.
 * @param qnaSessionId - id of the current QnA session
 * @param questionContent - question asked that failed to save when error occured
 * @returns Adaptive Card with question asked in text box
 */
export const getResubmitQuestionCard = (
    qnaSessionId: string,
    questionContent: string
): AdaptiveCard => {
    return adaptiveCardBuilder.getResubmitQuestionErrorCard(
        qnaSessionId,
        questionContent
    );
};

/**
 * Calls database to check if specified user is the host for the current QnA session
 * @param qnaSessionId - id of the current QnA session
 * @param userAadObjId - aadObjId of the current user
 */
export const isHost = async (
    qnaSessionId: string,
    userAadObjId: string
): Promise<boolean> => {
    try {
        const result = await qnaSessionDataService.isHost(
            qnaSessionId,
            userAadObjId
        );
        return result;
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
export const generateInitialsImage = async (
    initials: string,
    index: number
): Promise<jimp> => {
    const image = new jimp(52, 52, avatarColors[index]);
    const font = await jimp.loadFont(
        join(__dirname, 'public/segoeUiSemiboldWhite.fnt')
    );
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
export const validateConversationId = async (
    qnaSessionId: string,
    conversationId: string
): Promise<boolean> => {
    try {
        const qnaSessionData = await qnaSessionDataService.getQnASessionData(
            qnaSessionId
        );
        return (
            qnaSessionData.conversationId.split(';')[0] ===
            conversationId.split(';')[0]
        );
    } catch (error) {
        exceptionLogger(error);
        throw new Error(
            'Unable to validate conversationId of incoming request'
        );
    }
};

/**
 * Calls database to check if current QnA session is active
 * @param qnaSessionId - id of the current QnA session
 */
export const isActiveQnA = async (qnaSessionId: string): Promise<boolean> => {
    try {
        const result = await qnaSessionDataService.isActiveQnA(qnaSessionId);
        return result;
    } catch (error) {
        exceptionLogger(error);
        throw new Error('Failed to check if QnA session is active');
    }
};
