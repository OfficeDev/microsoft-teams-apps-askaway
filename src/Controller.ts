/* eslint-disable @typescript-eslint/no-unused-vars */
// Middleman file to allow for communication between the bot, database, and adaptive card builder.
import * as db from './Data/Database'; // For database calls
import * as adaptiveCardBuilder from './AdaptiveCards/AdaptiveCardBuilder'; // To populate adaptive cards
import { ok, err, Result } from './util';
import { AdaptiveCard } from 'adaptivecards';

db.initiateConnection(process.env.MONGO_URI as string);

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
