// All the functions to populate the adaptive cards should go in here

import { AdaptiveCard, IAdaptiveCard } from 'adaptivecards';
import * as ACData from 'adaptivecards-templating';
import * as moment from 'moment';

import { IQuestionPopulatedUser } from '../Data/Schemas/Question';

import MasterCard, { viewLeaderboardButton } from './MasterCard';
import StartAMACard from './StartAMACard';
import endAMAMastercardTemplate from './EndAMA';
import endAMAConfirmationCardTemplate from './EndAMAConfirmation';

import { Leaderboard, LeaderboardEmpty } from './Leaderboard';

import newQuestionCardTemplate from './NewQuestion';

import InvalidTaskError from './ErrorCard';

/**
 * Creates the AMA Master Card
 * @param title - title of AMA
 * @param description - description of AMA
 * @param userName - name of the user who created the AMA session
 * @param amaSessionId - document database id of the AMA session
 * @param userId - Id of the user who created the AMA session
 * @param ended - whether the AMA session has ended or not
 * @param topQuestionsData - array of questions to display under `Top Questions`
 * @param recentQuestionsData - array of questions to display under `Recent Questions`
 * @param showDateUpdated - whether to show last updated date or not
 * @returns The AMA Master Card
 */
export const getMasterCard = async (
    title: string,
    description: string,
    userName: string,
    amaSessionId: string,
    aadObjectId: string,
    ended?: boolean,
    topQuestionsData?: IQuestionPopulatedUser[],
    recentQuestionsData?: IQuestionPopulatedUser[],
    showDateUpdated = false
): Promise<AdaptiveCard> => {
    const data = {
        title,
        description,
        userName,
        amaSessionId,
        aadObjectId,
        ended,
    };
    const _processQuestions = (questions: IQuestionPopulatedUser[]) =>
        questions.map((question: IQuestionPopulatedUser) => {
            const questionObject = question.toObject();
            questionObject.userId.picture = _getPersonImage(
                questionObject.userId.userName
            );
            questionObject.upvotes = questionObject.voters.length;
            questionObject.upvotable =
                aadObjectId !== questionObject.userId._id;
            return questionObject;
        });

    topQuestionsData = topQuestionsData
        ? _processQuestions(topQuestionsData)
        : [];

    recentQuestionsData = recentQuestionsData
        ? _processQuestions(recentQuestionsData)
        : [];

    const dateUpdated = showDateUpdated
        ? moment().format('ddd, MMM D, YYYY, h:mm A')
        : '';

    const masterCard = MasterCard;
    if (ended)
        // remove `Ask a Question` and `End AMA` buttons
        masterCard.actions = [viewLeaderboardButton];

    const template = new ACData.Template(masterCard).expand({
        $root: {
            title: title,
            description: description,
            user: userName,
            amaId: amaSessionId,
            topQuestions: topQuestionsData,
            recentQuestions: recentQuestionsData,
            userId: aadObjectId,
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
 * @returns The adaptive card displayed when a task/submit error occurs.
 */
export const getErrorCard = (errorMessage: string): AdaptiveCard => {
    const template = new ACData.Template(InvalidTaskError).expand({
        $root: {
            // 'Your submission encountered an error. Please try submitting again!',
            errorMessage,
        },
    });

    return _adaptiveCard(template);
};

/**
 * Returns the adaptive card for the leaderboard populated with the questions provided.
 * @param questionData - Array of question documents to populate the leaderboard with. The 'userId' field of each Questoin document should be populated prior to passing into this function.
 * @param aadObjectId - aadObjectId of the user opening the leaderboard. Used to format "My Questions" area of the leaderboard properly, as well as disallow users from upvoting their own questions.
 * @param amaSessionId - Database document id of the AMA session.
 * @param isHost - boolean value indicating if user is the host of this current AMA session
 * @param isActiveAMA - boolean value indicating if current AMA session is active
 * @returns - Adaptive Card for the leaderboard populated with the questions provided.
 */
export const generateLeaderboard = (
    questionData: IQuestionPopulatedUser[],
    aadObjectId: string,
    amaSessionId: string,
    isHost?: boolean,
    isActiveAMA?: boolean
): AdaptiveCard => {
    if (!questionData.length)
        return generateEmptyLeaderboard(amaSessionId, isHost, isActiveAMA);

    const leaderboardTemplate = Leaderboard();

    questionData = questionData.map((question) => {
        const questionObject = question.toObject();
        questionObject.upvotes = questionObject.voters.length;
        questionObject.upvotable = aadObjectId !== questionObject.userId._id;
        questionObject.userId.picture = _getPersonImage(
            questionObject.userId.userName
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
            amaSessionId: amaSessionId,
            amaId: amaSessionId,
            isUserHost: isHost,
            isActive: isActiveAMA,
        },
    };

    const leaderboardPopulated = new ACData.Template(
        leaderboardTemplate
    ).expand(data);

    return _adaptiveCard(leaderboardPopulated);
};

/**
 * Generates the empty leaderboard
 * @param amaSessionId - id of the current AMA session
 * @param isHost - boolean value indicating if user is the host of this current AMA session
 * @param isActiveAMA - boolean value indicating if current AMA session is active
 */
const generateEmptyLeaderboard = (
    amaSessionId: string,
    isHost?: boolean,
    isActiveAMA?: boolean
): AdaptiveCard => {
    const leaderboardTemplate = LeaderboardEmpty();

    const data = {
        $root: {
            amaId: amaSessionId,
            isUserHost: isHost,
            isActive: isActiveAMA,
        },
    };

    const emptyLeaderboard = new ACData.Template(leaderboardTemplate).expand(
        data
    );

    return _adaptiveCard(emptyLeaderboard);
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

const _getPersonImage = (name: string) => {
    if (!name) return '';

    const userNameArray = name.split(' ');
    const str =
        userNameArray.length > 1
            ? `${userNameArray[0][0]}+${userNameArray[1][0]}`
            : `${userNameArray[0][0]}`;

    // Currently using the following external API for generating user initials avatars. Will switch to local library after consulting with
    // Kiran and designers.
    return `https://ui-avatars.com/api/?name=${str}`;
};
