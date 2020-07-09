import MasterCard, {
    MasterCardData,
    viewLeaderboardButton,
} from './MasterCard';
import * as ACData from 'adaptivecards-templating';
import StartAMACard from './StartAMACard';
import { AdaptiveCard, IAdaptiveCard } from 'adaptivecards';
import InvalidTaskError from './InvalidTaskError';

// All the functions to populate the adaptive cards should go in here
import {
    Leaderboard,
    LeaderboardEmpty,
    LeaderboardFailed,
} from './Leaderboard';
import endAMAConfirmationCardTemplate from './EndAMAConfirmation';
import newQuestionCardTemplate from './NewQuestion';
import newQuestionErrorCardTemplate from './NewQuestionError';
import * as moment from 'moment';
import endAMAMastercardTemplate from './EndAMA';

const imageURLPrefix =
    'https://prod-20.westcentralus.logic.azure.com/workflows/221a2c4d287d4491b865fc07811621ce/triggers/manual/paths/invoke/image/';

const imageURLPostfix =
    '?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=W00knTG9588splfzI-euRE5UuILYTEhTGzy23fuAHRc';

/**
 * Creates the AMA Master Card
 * @param title - title of AMA
 * @param description - description of AMA
 * @param userName - name of the user who created the AMA session
 * @param amaSessionId - document database id of the AMA session
 * @param userId - Id of the user who created the AMA session
 * @param ended - whether the AMA session has ended or not
 * @param showDate - whether to show last updated date or not
 * @returns The AMA Master Card
 */
export const getMasterCard = async (
    title: string,
    description: string,
    userName: string,
    amaSessionId: string,
    userId: string,
    ended = false,
    showDate = false
): Promise<AdaptiveCard> => {
    const data: MasterCardData = {
        title,
        description,
        userName,
        amaSessionId,
        userId,
        ended,
    };
    const dateUpdated = showDate
        ? moment().format('ddd, MMM D, YYYY, h:mm A')
        : '';

    const masterCard = MasterCard;
    if (ended) {
        // remove `Ask a Question` and `End AMA` buttons
        masterCard.actions = [viewLeaderboardButton];
    }

    const template = new ACData.Template(MasterCard).expand({
        $root: {
            title: title,
            description: description,
            user: userName,
            amaId: amaSessionId,
            userId: userId,
            image: `https://${process.env.HOSTNAME}/images/title_bg.png`,
            data: data,
            actionBy: ended ? 'Ended by' : 'Initiated by',
            dateLastUpdated: dateUpdated,
        },
    });

    return _adaptiveCard(template);
};

/**
 * @returns The adaptive card used to collect data to create the AMA session
 */
export const getStartAMACard = (
    title = '',
    description = '',
    errorMessage = ''
): AdaptiveCard => {
    const template = new ACData.Template(StartAMACard).expand({
        $root: {
            title,
            description,
            errorMessage,
        },
    });
    return _adaptiveCard(template);
};

/**
 * @returns The adaptive card displayed when a task/fetch error occurs.
 */
export const getTaskFetchErrorCard = (): AdaptiveCard => {
    const template = new ACData.Template(InvalidTaskError).expand({
        $root: {
            errorMsg: 'Something went wrong. Please try opening again.',
        },
    });

    return _adaptiveCard(template);
};

/**
 * @returns The adaptive card displayed when a task/submit error occurs.
 */
export const getTaskSubmitErrorCard = (): AdaptiveCard => {
    const template = new ACData.Template(InvalidTaskError).expand({
        $root: {
            errorMsg:
                'Your submission encountered an error. Please try submitting again!',
        },
    });

    return _adaptiveCard(template);
};

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
 * Returns an adaptive card informing the user that the generation of the leaderboard failed.
 */
export const generateLeaderboardFailed = (): AdaptiveCard => {
    return _adaptiveCard(LeaderboardFailed);
};

const getPersonImage = (aadObjectId: string) => {
    return `${imageURLPrefix}${aadObjectId}${imageURLPostfix}`;
};

/**
 * Creates and parses the adaptive card for creating a new question.
 * @param amaSessionId - id of the current AMA session
 * @returns Adaptive Card associated with creating a new question
 */
export const getNewQuestionCard = (amaSessionId: string): AdaptiveCard => {
    const template = new ACData.Template(newQuestionCardTemplate).expand({
        $root: {
            amaId: amaSessionId,
        },
    });
    return _adaptiveCard(template);
};

/**
 * Creates and parses the adaptive card for errors when creating a new question.
 * @returns Adaptive Card associated with errors from creating a new question
 */
export const getQuestionErrorCard = (): AdaptiveCard =>
    _adaptiveCard(newQuestionErrorCardTemplate);

/**
 * Makes an adaptive card template into an adaptive card object.
 * @param template - adaptive card template to parse
 */
export const _adaptiveCard = (template: IAdaptiveCard): AdaptiveCard => {
    // Parses the adaptive card template
    const adaptiveCard = new AdaptiveCard();
    adaptiveCard.parse(template);
    return adaptiveCard;
};

/**
 * Creates and parses the adaptive card for confirming the ending of an AMA.
 * @param amaSessionId - id of the current AMA session
 * @returns Adaptive Card for confirming end of AMA
 */
export const getEndAMAConfirmationCard = (
    amaSessionId: string
): AdaptiveCard => {
    const template = new ACData.Template(endAMAConfirmationCardTemplate).expand(
        {
            $root: {
                amaId: amaSessionId,
            },
        }
    );
    return _adaptiveCard(template);
};

/**
 * Creates and parses the adaptive card used to display the ending mastercard.
 * @param amaTitle - title of the AMA
 * @param amaDesc - description of the AMA
 * @param amaSessionId - id of the AMA session
 * @param userName - name of the user who ended the AMA
 * @returns Adaptive Card that is the ending Mastercard
 */
export const getEndAMAMastercard = (
    amaTitle: string,
    amaDesc: string,
    amaSessionId: string,
    userName: string
): AdaptiveCard => {
    const template = new ACData.Template(endAMAMastercardTemplate).expand({
        $root: {
            title: amaTitle,
            description: amaDesc,
            amaId: amaSessionId,
            user: userName,
            image:
                'https://github.com/kavins14/random/blob/master/title_bg.png?raw=true', // TODO: Find reliable image hosting,
        },
    });
    return _adaptiveCard(template);
};

/**
 * Creates and parses the adaptive card used to address errors when asking a new question.
 * @param amaSessionId - id of the AMA session
 * @param questionContent - question asked that failed to save when error occured
 * @returns Adaptive Card with question asked inside text box
 */
export const getResubmitQuestionErrorCard = (
    amaSessionId: string,
    questionContent: string
): AdaptiveCard => {
    const template = new ACData.Template(newQuestionCardTemplate).expand({
        $root: {
            amaId: amaSessionId,
            question: questionContent,
        },
    });
    return _adaptiveCard(template);
};
