// Middleman file to allow for communication between the bot, database, and adaptive card builder.
import * as adaptiveCardBuilder from 'src/adaptive-cards/adaptiveCardBuilder'; // To populate adaptive cards
import { ok, err, Result } from 'src/util/ResultWrapper';
import { AdaptiveCard } from 'adaptivecards';
import { IQuestion, IQuestionPopulatedUser } from 'src/Data/Schemas/Question';
import { exceptionLogger } from 'src/util/ExceptionTracking';
import jimp from 'jimp';
import { join } from 'path';
import { qnaSessionDataService } from './data/services/qnaSessionDataService';
import { questionDataService } from './data/services/questionDataService';

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
 * @param title - title of QnA
 * @param description - description of QnA
 * @param userName - name of the user who created the QnA
 * @param userAadObjId - AAD Object Id of the suer who created the QnA
 * @param activityId - id of the master card message used for proactive updating
 * @param tenantId - id of tenant the bot is running on.
 * @param scopeId - channel id or group chat id
 * @param hostUserId - MS Teams Id of user who created the QnA (used for at-mentions)
 * @param isChannel - whether the QnA session was started in a channel or group chat
 * @returns the master adaptive card
 */
export const startQnASession = async (
    title: string,
    description: string,
    userName: string,
    userAadObjId: string,
    activityId: string,
    conversationId: string,
    tenantId: string,
    scopeId: string,
    hostUserId: string,
    isChannel: boolean
): Promise<Result<{ card: AdaptiveCard; qnaSessionId: string }, Error>> => {
    try {
        // save data to db
        const response = await qnaSessionDataService.createQnASession(
            title,
            description,
            userName,
            userAadObjId,
            activityId,
            conversationId,
            tenantId,
            scopeId,
            hostUserId,
            isChannel
        );

        // generate and return maincard
        return ok({
            card: await getMainCard(
                title,
                description,
                userName,
                response.qnaSessionId,
                response.hostId,
                hostUserId
            ),
            qnaSessionId: response.qnaSessionId,
        });
    } catch (error) {
        exceptionLogger(error);
        return err(Error('Failed to start QnA'));
    }
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
): Promise<Result<AdaptiveCard, Error>> => {
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
        return ok(
            await adaptiveCardBuilder.generateLeaderboard(
                questionData,
                aadObjectId,
                qnaSessionId,
                isHost,
                isActiveQnA,
                theme
            )
        );
    } catch (error) {
        exceptionLogger(error);
        return err(new Error('Retrieving Leaderboard Failed.'));
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
        return ok(
            await qnaSessionDataService.updateActivityId(
                qnaSessionId,
                activityId
            )
        );
    } catch (error) {
        exceptionLogger(error);
        return err(error);
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
 * @param qnaSessionId - id of the current QnA session
 * @param userAadObjId - AAD Obj ID of the current user
 * @param userName - name of the user
 * @param questionContent - question content asked by the user
 * @returns Returns ok object if successful, otherwise returns error
 */
export const submitNewQuestion = async (
    qnaSessionId: string,
    userAadObjId: string,
    userName: string,
    questionContent: string
): Promise<Result<boolean, Error>> => {
    try {
        await questionDataService.createQuestion(
            qnaSessionId,
            <string>userAadObjId,
            userName,
            questionContent
        );

        return ok(true);
    } catch (error) {
        exceptionLogger(error);
        return err(Error('Failed to submit new question'));
    }
};

export const getUpdatedMainCard = async (
    qnaSessionId: string,
    ended = false
): Promise<Result<{ card: AdaptiveCard; activityId: string }, Error>> => {
    try {
        const qnaSessionData = await qnaSessionDataService.getQnASessionData(
            qnaSessionId
        );
        // eslint-disable-next-line prefer-const
        const {
            topQuestions,
            recentQuestions,
            numQuestions,
        } = await questionDataService.getQuestions(qnaSessionId, 3);

        // generate and return maincard
        return ok({
            card: await getMainCard(
                qnaSessionData.title,
                qnaSessionData.description,
                qnaSessionData.userName,
                qnaSessionId,
                qnaSessionData.userAadObjId,
                qnaSessionData.hostUserId,
                ended || !qnaSessionData.isActive,
                topQuestions,
                recentQuestions,
                numQuestions
            ),
            activityId: qnaSessionData.activityId,
            numQuestions,
        });
    } catch (error) {
        exceptionLogger(error);
        return err(Error('Failed to get top questions'));
    }
};
/**
 * Upvotes a question and returns an updated leaderboard
 * @param questionId - DBID of the question being upvoted
 * @param aadObjectId - aadObjectId of the user upvoting the question
 * @param name - Name of the user upvoting the question
 * @param theme - Teams theme of the user upvoting. Options are 'default', 'dark', or 'high-contrast'
 */
export const updateUpvote = async (
    questionId: string,
    aadObjectId: string,
    name: string,
    theme: string
): Promise<Result<AdaptiveCard, Error>> => {
    try {
        const question: IQuestion = await questionDataService.updateUpvote(
            questionId,
            aadObjectId,
            name
        );
        return generateLeaderboard(question.qnaSessionId, aadObjectId, theme);
    } catch (error) {
        exceptionLogger(error);
        return err(Error('Failed to upvote question.'));
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
 * @returns Ok object with updated Master Card
 */
export const endQnASession = async (
    qnaSessionId: string,
    aadObjectId: string
): Promise<Result<{ card: AdaptiveCard; activityId: string }, Error>> => {
    try {
        const isActive = await qnaSessionDataService.isActiveQnA(qnaSessionId);
        const isHost = await qnaSessionDataService.isHost(
            qnaSessionId,
            aadObjectId
        );

        if (!isActive) return err(Error('The QnA session has already ended'));
        if (!isHost)
            return err(Error('Insufficient permissions to end QnA session'));
        await qnaSessionDataService.endQnASession(qnaSessionId);

        const updatedMainCard = await getUpdatedMainCard(qnaSessionId, true);

        if (updatedMainCard.isErr()) throw updatedMainCard.value;

        return updatedMainCard;
    } catch (error) {
        exceptionLogger(error);
        return err(Error('Failed to end QnA session'));
    }
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
): Promise<Result<boolean, Error>> => {
    try {
        const result = await qnaSessionDataService.isHost(
            qnaSessionId,
            userAadObjId
        );
        return ok(result);
    } catch (error) {
        exceptionLogger(error);
        return err(
            Error('Failed to check if user is host for this QnA session')
        );
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
): Promise<Result<boolean, Error>> => {
    try {
        const qnaSessionData = await qnaSessionDataService.getQnASessionData(
            qnaSessionId
        );
        return ok(
            qnaSessionData.conversationId.split(';')[0] ===
                conversationId.split(';')[0]
        );
    } catch (error) {
        exceptionLogger(error);
        return err(
            new Error('Unable to validate conversationId of incoming request')
        );
    }
};

/**
 * Calls database to check if current QnA session is active
 * @param qnaSessionId - id of the current QnA session
 */
export const isActiveQnA = async (
    qnaSessionId: string
): Promise<Result<boolean, Error>> => {
    try {
        const result = await qnaSessionDataService.isActiveQnA(qnaSessionId);
        return ok(result);
    } catch (error) {
        exceptionLogger(error);
        return err(Error('Failed to check if QnA session is active'));
    }
};
