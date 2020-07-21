/* eslint-disable @typescript-eslint/no-unused-vars */
// Middleman file to allow for communication between the bot, database, and adaptive card builder.
import * as db from './Data/Database'; // For database calls
import * as adaptiveCardBuilder from './AdaptiveCards/AdaptiveCardBuilder'; // To populate adaptive cards
import { ok, err, Result } from './util';
import { AdaptiveCard } from 'adaptivecards';
import { IQuestion, IQuestionPopulatedUser } from './Data/Schemas/Question';
import { aiClient } from './app/server';

db.initiateConnection(process.env.MONGO_URI as string).catch((error) => {
    aiClient.trackException({ exception: error });
});

export const getMasterCard = adaptiveCardBuilder.getMasterCard;
export const getStartAMACard = adaptiveCardBuilder.getStartAMACard;
export const getTaskFetchErrorCard = adaptiveCardBuilder.getErrorCard.bind(
    'Something went wrong. Please try opening again.'
);
export const getTaskSubmitErrorCard = adaptiveCardBuilder.getErrorCard.bind(
    'Your submission encountered an error. Please try submitting again!'
);
export const getErrorCard = adaptiveCardBuilder.getErrorCard;
/**
 * Starts the AMA session
 * @param title - title of AMA
 * @param description - description of AMA
 * @param userName - name of the user who created the AMA
 * @param userAadObjId - AAD Object Id of the suer who created the AMA
 * @param activityId - id of the master card message used for proactive updating
 * @param tenantId - id of tenant the bot is running on.
 * @param scopeId - channel id or group chat id
 * @param isChannel - whether the AMA session was started in a channel or group chat
 * @returns the master adaptive card
 */
export const startAMASession = async (
    title: string,
    description: string,
    userName: string,
    userAadObjId: string,
    activityId: string,
    tenantId: string,
    scopeId: string,
    isChannel: boolean
): Promise<Result<{ card: AdaptiveCard; amaSessionId: string }, Error>> => {
    try {
        // save data to db
        const response = await db.createAMASession(
            title,
            description,
            userName,
            userAadObjId,
            activityId,
            tenantId,
            scopeId,
            isChannel
        );

        // generate and return mastercard
        return ok({
            card: await getMasterCard(
                title,
                description,
                userName,
                response.amaSessionId,
                response.hostId
            ),
            amaSessionId: response.amaSessionId,
        });
    } catch (error) {
        aiClient.trackException({ exception: error });
        return err(Error('Failed to start AMA'));
    }
};

/**
 * Returns the populated leaderboard adaptive card for the AMA session attached to the id provided.
 * @param amaSessionId - ID of the AMA session for which the leaderboard shouold be retrieived.
 * @param aadObjectId - aadObjectId of the user who is trying view the leaderboard. This is to used to control certain factors such as not letting the user upvote their own questions.
 * @param isHost - boolean value indicating if user is the host of this current AMA session
 * @param isActiveAMA - boolean value indicating if current AMA session is active
 * @returns - A promise containing a result object which, on success, contains the populated leaderboard adaptive card, and on failure, contains an error card.
 */
export const generateLeaderboard = async (
    amaSessionId: string,
    aadObjectId: string,
    isHost?: boolean,
    isActiveAMA?: boolean
): Promise<Result<AdaptiveCard, Error>> => {
    try {
        const questionData: IQuestionPopulatedUser[] = await db.getQuestionData(
            amaSessionId
        );
        return ok(
            adaptiveCardBuilder.generateLeaderboard(
                questionData,
                aadObjectId,
                amaSessionId,
                isHost,
                isActiveAMA
            )
        );
    } catch (error) {
        aiClient.trackException({ exception: error });
        return err(new Error('Retrieving Leaderboard Failed.'));
    }
};

/**
 * Sets the activity id of an existing AMA session
 * @param amaSessionId - document database id of the AMA session
 * @param activityId - id of the master card message used for proactive updating of the card
 */
export const setActivityId = async (
    amaSessionId: string,
    activityId: string
) => {
    try {
        return ok(await db.updateActivityId(amaSessionId, activityId));
    } catch (error) {
        aiClient.trackException({ exception: error });
        return err(error);
    }
};

/**
 * Calls adaptiveCardbuilder to get the newQuestionCard.
 * @returns Adaptive Card associated with creating a new question
 */
export const getNewQuestionCard = (amaSessionId: string): AdaptiveCard => {
    return adaptiveCardBuilder.getNewQuestionCard(amaSessionId);
};

/**
 * Handles and formats the parameters, then sends new question details to the database.
 * @param amaSessionId - id of the current AMA session
 * @param userAadObjId - AAD Obj ID of the current user
 * @param userName - name of the user
 * @param questionContent - question content asked by the user
 * @returns Returns ok object if successful, otherwise returns error
 */
export const submitNewQuestion = async (
    amaSessionId: string,
    userAadObjId: string,
    userName: string,
    questionContent: string
): Promise<Result<boolean, Error>> => {
    try {
        await db.createQuestion(
            amaSessionId,
            userAadObjId as string,
            userName,
            questionContent
        );

        return ok(true);
    } catch (error) {
        aiClient.trackException({ exception: error });
        return err(Error('Failed to submit new question'));
    }
};

export const getUpdatedMasterCard = async (
    amaSessionId: string,
    ended = false
): Promise<Result<{ card: AdaptiveCard; activityId: string }, Error>> => {
    try {
        const amaSessionData = await db.getAMASessionData(amaSessionId);
        // eslint-disable-next-line prefer-const
        const {
            topQuestions,
            recentQuestions,
            numQuestions,
        } = await db.getQuestions(amaSessionId, 3, 3);

        // generate and return mastercard
        return ok({
            card: await getMasterCard(
                amaSessionData.title,
                amaSessionData.description,
                amaSessionData.userName,
                amaSessionId,
                amaSessionData.userAadObjId,
                ended || !amaSessionData.isActive,
                topQuestions,
                recentQuestions,
                true
            ),
            activityId: amaSessionData.activityId,
            numQuestions,
        });
    } catch (error) {
        aiClient.trackException({ exception: error });
        return err(Error('Failed to get top questions'));
    }
};
/**
 * Upvotes a question and returns an updated leaderboard
 * @param questionId - DBID of the question being upvoted
 * @param aadObjectId - aadObjectId of the user upvoting the question
 * @param name - Name of the user upvoting the question
 * @param isHost - boolean value indicating if user is the host of this current AMA session
 * @param isActiveAMA - boolean value indicating if current AMA session is active
 */
export const addUpvote = async (
    questionId: string,
    aadObjectId: string,
    name: string,
    isHost?: boolean,
    isActiveAMA?: boolean
): Promise<Result<AdaptiveCard, Error>> => {
    try {
        const question: IQuestion = await db.addUpvote(
            questionId,
            aadObjectId,
            name
        );
        return generateLeaderboard(
            question.amaSessionId,
            aadObjectId,
            isHost,
            isActiveAMA
        );
    } catch (error) {
        aiClient.trackException({ exception: error });
        return err(Error('Failed to upvote question.'));
    }
};

/*
 * Calls adaptiveCardBuilder to get the endAMAConfirmationCard.
 * @param amaSessionId - id of the current AMA session
 * @returns Adaptive Card associated with confirming the ending of an AMA
 */
export const getEndAMAConfirmationCard = (
    amaSessionId: string
): AdaptiveCard => {
    return adaptiveCardBuilder.getEndAMAConfirmationCard(amaSessionId);
};

/**
 * Communicates with database to end the AMA and retrieves details
 * @param amaSessionId - id of the current AMA session
 * @returns Ok object with updated Master Card
 */
export const endAMASession = async (
    amaSessionId: string
): Promise<Result<{ card: AdaptiveCard; activityId: string }, Error>> => {
    try {
        await db.endAMASession(amaSessionId);

        const updatedMasterCard = await getUpdatedMasterCard(
            amaSessionId,
            true
        );

        if (updatedMasterCard.isErr()) throw updatedMasterCard.value;

        return updatedMasterCard;
    } catch (error) {
        aiClient.trackException({ exception: error });
        return err(Error('Failed to end AMA session'));
    }
};

/**
 * Calls adaptiveCardBuilder to get resubmitQuestionCard.
 * @param amaSessionId - id of the current AMA session
 * @param questionContent - question asked that failed to save when error occured
 * @returns Adaptive Card with question asked in text box
 */
export const getResubmitQuestionCard = (
    amaSessionId: string,
    questionContent: string
): AdaptiveCard => {
    return adaptiveCardBuilder.getResubmitQuestionErrorCard(
        amaSessionId,
        questionContent
    );
};

/**
 * Calls database to check if specified user is the host for the current AMA session
 * @param amaSessionId - id of the current AMA session
 * @param userAadObjId - aadObjId of the current user
 */
export const isHost = async (
    amaSessionId: string,
    userAadObjId: string
): Promise<Result<boolean, Error>> => {
    try {
        const result = await db.isHost(amaSessionId, userAadObjId);
        return ok(result);
    } catch (error) {
        aiClient.trackException({ exception: error });
        return err(
            Error('Failed to check if user is host for this AMA session')
        );
    }
};

/**
 * Calls database to check if current AMA session is active
 * @param amaSessionId - id of the current AMA session
 */
export const isActiveAMA = async (
    amaSessionId: string
): Promise<Result<boolean, Error>> => {
    try {
        const result = await db.isActiveAMA(amaSessionId);
        return ok(result);
    } catch (error) {
        aiClient.trackException({ exception: error });
        return err(Error('Failed to check if AMA session is active'));
    }
};
