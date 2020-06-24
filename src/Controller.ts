/* eslint-disable @typescript-eslint/no-unused-vars */
// Middleman file to allow for communication between the bot, database, and adaptive card builder.
import * as db from './Data/Database'; // For database calls
import * as adaptiveCardBuilder from './AdaptiveCards/AdaptiveCardBuilder';
import { AdaptiveCard } from 'adaptivecards';
import { Result, ok } from './util';

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
