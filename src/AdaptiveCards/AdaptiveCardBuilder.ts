// All the functions to populate the adaptive cards should go in here
import {
    Leaderboard,
    LeaderboardEmpty,
    LeaderboardFailed,
} from './Leaderboard';
import * as ACData from 'adaptivecards-templating';
import { AdaptiveCard } from 'adaptivecards';
import InvalidTaskFetch from './InvalidTaskFetch';
import newQuestionCardTemplate from './NewQuestion';
import newQuestionErrorCardTemplate from './NewQuestionError';

const imageURLPrefix =
    'https://prod-20.westcentralus.logic.azure.com/workflows/221a2c4d287d4491b865fc07811621ce/triggers/manual/paths/invoke/image/';

const imageURLPostfix =
    '?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=W00knTG9588splfzI-euRE5UuILYTEhTGzy23fuAHRc';

/**
 * Returns the adaptive card for the leaderboard populated with the questions provided.
 * @param questionData - Array of question documents to populate the leaderboard with. The 'userId' field of each Questoin document should be populated prior to passing into this function.
 * @param aadObjectId - aadObjectId of the user opening the leaderboard. Used to format "My Questions" area of the leaderboard properly, as well as disallow users from upvoting their own questions.
 * @returns - Adaptive Card for the leaderboard populated with the questions provided.
 */
export const generateLeaderboard = (
    questionData,
    aadObjectId: string
): AdaptiveCard => {
    if (!questionData.length) {
        return _adaptiveCard(LeaderboardEmpty);
    }

    const leaderboardTemplate = new ACData.Template(Leaderboard);

    questionData = questionData.map((question) => {
        const questionObject = question.toObject();
        questionObject.upvotes = questionObject.voters.length;
        questionObject.upvotable = aadObjectId !== questionObject.userId._id;
        questionObject.userId.picture = getPersonImage(
            questionObject.userId._id
        );
        return questionObject;
    });
    const userQuestions = questionData.filter(
        (question) => question.userId._id === aadObjectId
    );

    const data = {
        $root: {
            userHasQuestions: userQuestions.length > 0,
            userQuestions,
            questions: questionData,
        },
    };

    const leaderboardPopulated = leaderboardTemplate.expand(data);
    return _adaptiveCard(leaderboardPopulated);
};

/**
 * Returns an adaptive card informing the user that the generatio of the leaderboard failed.
 */
export const generateLeaderboardFailed = (): AdaptiveCard => {
    return _adaptiveCard(LeaderboardFailed);
};

const getPersonImage = (aadObjectId: string) => {
    return `${imageURLPrefix}${aadObjectId}${imageURLPostfix}`;
};

/**
 * Returns an adaptive card informing the user that the task/fetch failed.
 */
export const getInvalidTaskFetch = (): AdaptiveCard => {
    return _adaptiveCard(InvalidTaskFetch);
};

/**
 * Creates and parses the adaptive card for creating a new question.
 * @returns Adaptive Card associated with creating a new question
 */
export const getNewQuestionCard = (amaSessionId: string): AdaptiveCard => {
    const template = new ACData.Template(newQuestionCardTemplate).expand({
        $root: {
            AMA_ID: amaSessionId,
        },
    });
    return _adaptiveCard(template);
};

/**
 * Creates and parses the adaptive card for errors when creating a new question.
 * @returns Adaptive Card associated with errors from creating a new question
 */
export const getQuestionErrorCard = (): AdaptiveCard => {
    const adaptiveCard = new AdaptiveCard();
    adaptiveCard.parse(newQuestionErrorCardTemplate);
    return adaptiveCard;
};

const _adaptiveCard = (template: any): AdaptiveCard => {
    // Parses the adaptive card template
    const adaptiveCard = new AdaptiveCard();
    adaptiveCard.parse(template);
    return adaptiveCard;
};
