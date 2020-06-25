/* eslint-disable @typescript-eslint/no-unused-vars */
// Middleman file to allow for communication between the bot, database, and adaptive card builder.
import * as db from './Data/Database'; // For database calls
import * as adaptiveCardBuilder from './AdaptiveCards/AdaptiveCardBuilder'; // To populate adaptive cards
import { ok, err, Result } from './util';
import { AdaptiveCard } from 'adaptivecards';

db.initiateConnection(process.env.MONGO_URI as string);

export const getMasterCard = adaptiveCardBuilder.getMasterCard;
export const getStartAMACard = adaptiveCardBuilder.getStartAMACard;
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
        console.error(error);
        return err(Error('Failed to start AMA'));
    }
}

/**
 * Returns the populated leaderboard adaptive card for the AMA session attached to the id provided.
 * @param amaSessionId - ID of the AMA session for which the leaderboard shouold be retrieived.
 * @param aadObjectId - aadObjectId of the user who is trying view the leaderboard. This is to used to control certain factors such as not letting the user upvote their own questions.
 * @returns - A promise containing a result object which, on success, contains the populated leaderboard adaptive card, and on failure, contains an error card.
 */
export const generateLeaderboard = async (
    amaSessionId: string,
    aadObjectId: string
): Promise<Result<AdaptiveCard, AdaptiveCard>> => {
    try {
        const questionData = await db.getQuestionData(amaSessionId);
        return ok(
            adaptiveCardBuilder.generateLeaderboard(questionData, aadObjectId)
        );
    } catch (error) {
        console.error(error);
        return err(adaptiveCardBuilder.generateLeaderboardFailed());
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
        console.error(error);
        return err(error);
    }
}

/**
 * Returns an adaptive card with a message that the task/fetch failed.
 */
export const getInvalidTaskFetch = adaptiveCardBuilder.getInvalidTaskFetch;

db.initiateConnection(process.env.MONGO_DB_CONNECTION_STRING as string);

/**
 * Calls adaptiveCardbuilder to get the newQuestionCard.
 * @returns Adaptive Card associated with creating a new question
 */
export const getNewQuestionCard = (amaSessionId: string): AdaptiveCard => {
    return adaptiveCardBuilder.getNewQuestionCard(amaSessionId);
};

/**
 * Calls adaptiveCardBuilder to get the QuestionErrorCard.
 * @returns Adaptive Card associated with errors from creating a new question
 */
export const getQuestionErrorCard = (): AdaptiveCard => {
    return adaptiveCardBuilder.getQuestionErrorCard();
};

/**
 * Handles and formats the parameters, then sends new question details to the database.
 * @param taskModuleRequest - Object that contains information about the newly submitted question
 * @param user - Object that contains information about the associated user
 * @returns Returns ok object if successful, otherwise returns error
 */
export const submitNewQuestion = async (
    amaSessionId: string,
    userAadObjId: string,
    userName: string,
    questionContent: string
): Promise<Result<any, Error>> => {
    try {
        await db.createQuestion(
            amaSessionId,
            userAadObjId as string,
            userName,
            questionContent
        );

        return ok({
            status: true,
        });
    } catch (err) {
        return err(Error('Failed to submit new question'));
    }
};
