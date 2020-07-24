// All the functions to populate the adaptive cards should go in here

import { AdaptiveCard, IAdaptiveCard } from 'adaptivecards';
import * as ACData from 'adaptivecards-templating';
import moment from 'moment';
import * as random from 'random';
import seedrandom from 'seedrandom';
import * as jwt from 'jsonwebtoken';

import { IQuestionPopulatedUser } from 'src/Data/Schemas/Question';

import { MainCard, viewLeaderboardButton } from 'src/AdaptiveCards/MainCard';
import { StartQnACard } from 'src/AdaptiveCards/StartQnACard';
import { EndQnaConfirmation } from 'src/AdaptiveCards/EndQnAConfirmation';

import { Leaderboard, LeaderboardEmpty } from 'src/AdaptiveCards/Leaderboard';

import { NewQuestion } from 'src/AdaptiveCards/NewQuestion';

import { ErrorCard } from 'src/AdaptiveCards/ErrorCard';
import { mainCardStrings } from 'src/localization/locale';

/**
 * Creates the QnA Master Card
 * @param title - title of QnA
 * @param description - description of QnA
 * @param userName - name of the user who created the QnA session
 * @param qnaSessionId - document database id of the QnA session
 * @param userId - Id of the user who created the QnA session
 * @param ended - whether the QnA session has ended or not
 * @param topQuestionsData - array of questions to display under `Top Questions`
 * @param recentQuestionsData - array of questions to display under `Recent Questions`
 * @param showDateUpdated - whether to show last updated date or not
 * @returns The QnA Master Card
 */
export const getMainCard = async (
    title: string,
    description: string,
    userName: string,
    qnaSessionId: string,
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
        qnaSessionId,
        aadObjectId,
        ended,
    };
    const _processQuestions = (questions: IQuestionPopulatedUser[]) =>
        questions.map((question: IQuestionPopulatedUser) => {
            const questionObject = question.toObject();
            questionObject.userId.picture = _getPersonImage(
                questionObject.userId.userName,
                question.userId._id
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
        ? moment().format('ddd, MMM D, YYYY, h:mm A [GMT] Z')
        : '';

    const mainCard = MainCard();
    if (ended)
        // remove `Ask a Question` and `End QnA` buttons
        mainCard.actions = [viewLeaderboardButton()];

    // it is not wrapped around by _adaptiveCard() because it will remove
    // the `msTeams` property from the master card.
    return new ACData.Template(mainCard).expand({
        $root: {
            title: title,
            description: description,
            user: userName,
            qnaId: qnaSessionId,
            topQuestions: topQuestionsData,
            recentQuestions: recentQuestionsData,
            userId: aadObjectId,
            image: `https://${process.env.HostName}/images/title_bg.png`,
            data: data,
            sessionDetails: ended
                ? `${mainCardStrings('endedBy')} ${userName}. ${mainCardStrings(
                      'noMoreQuestions'
                  )}`
                : `${mainCardStrings('initiatedBy')} ${userName}`,
            dateLastUpdated: dateUpdated,
        },
    });
};

/**
 * @returns The adaptive card used to collect data to create the QnA session
 */
export const getStartQnACard = (
    title = '',
    description = '',
    errorMessage = ''
): AdaptiveCard => {
    const template = new ACData.Template(StartQnACard()).expand({
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
    const template = new ACData.Template(ErrorCard()).expand({
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
 * @param qnaSessionId - Database document id of the QnA session.
 * @param isHost - boolean value indicating if user is the host of this current QnA session
 * @param isActiveQnA - boolean value indicating if current QnA session is active
 * @returns - Adaptive Card for the leaderboard populated with the questions provided.
 */
export const generateLeaderboard = (
    questionData: IQuestionPopulatedUser[],
    aadObjectId: string,
    qnaSessionId: string,
    isHost?: boolean,
    isActiveQnA?: boolean
): AdaptiveCard => {
    if (!questionData.length)
        return generateEmptyLeaderboard(qnaSessionId, isHost, isActiveQnA);

    const leaderboardTemplate = Leaderboard();

    questionData = questionData.map((question) => {
        const questionObject = question.toObject();
        questionObject.upvotes = questionObject.voters.length;
        questionObject.upvotable = aadObjectId !== questionObject.userId._id;
        questionObject.upvoted = questionObject.voters.includes(aadObjectId);
        questionObject.userId.picture = _getPersonImage(
            questionObject.userId.userName,
            question.userId._id
        );
        questionObject.isActive = isActiveQnA;

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
            qnaSessionId: qnaSessionId,
            qnaId: qnaSessionId,
            isUserHost: isHost,
            isActive: isActiveQnA,
        },
    };

    const leaderboardPopulated = new ACData.Template(
        leaderboardTemplate
    ).expand(data);

    return _adaptiveCard(leaderboardPopulated);
};

/**
 * Generates the empty leaderboard
 * @param qnaSessionId - id of the current QnA session
 * @param isHost - boolean value indicating if user is the host of this current QnA session
 * @param isActiveQnA - boolean value indicating if current QnA session is active
 */
const generateEmptyLeaderboard = (
    qnaSessionId: string,
    isHost?: boolean,
    isActiveQnA?: boolean
): AdaptiveCard => {
    const leaderboardTemplate = LeaderboardEmpty();

    const data = {
        $root: {
            qnaId: qnaSessionId,
            isUserHost: isHost,
            isActive: isActiveQnA,
        },
    };

    const emptyLeaderboard = new ACData.Template(leaderboardTemplate).expand(
        data
    );

    return _adaptiveCard(emptyLeaderboard);
};

/**
 * Creates and parses the adaptive card for creating a new question.
 * @param qnaSessionId - id of the current QnA session
 * @returns Adaptive Card associated with creating a new question
 */
export const getNewQuestionCard = (qnaSessionId: string): AdaptiveCard => {
    const template = new ACData.Template(NewQuestion()).expand({
        $root: {
            qnaId: qnaSessionId,
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
 * Creates and parses the adaptive card for confirming the ending of an QnA.
 * @param qnaSessionId - id of the current QnA session
 * @returns Adaptive Card for confirming end of QnA
 */
export const getEndQnAConfirmationCard = (
    qnaSessionId: string
): AdaptiveCard => {
    const template = new ACData.Template(EndQnaConfirmation()).expand({
        $root: {
            qnaId: qnaSessionId,
        },
    });
    return _adaptiveCard(template);
};

/**
 * Creates and parses the adaptive card used to address errors when asking a new question.
 * @param qnaSessionId - id of the QnA session
 * @param questionContent - question asked that failed to save when error occured
 * @returns Adaptive Card with question asked inside text box
 */
export const getResubmitQuestionErrorCard = (
    qnaSessionId: string,
    questionContent: string
): AdaptiveCard => {
    const template = new ACData.Template(NewQuestion()).expand({
        $root: {
            qnaId: qnaSessionId,
            question: questionContent,
        },
    });
    return _adaptiveCard(template);
};

const _getPersonImage = (name: string, aadObjectId: string): string => {
    if (!name) return '';

    let initials = '';
    let space = true;
    let pCount = 0;
    for (let i = 0; i < name.length; i++) {
        const char = name[i].toUpperCase();
        if (char === ' ') {
            space = true;
        } else if (char === '(') {
            pCount++;
            space = false;
        } else if (char === ')') {
            pCount--;
            space = false;
        } else if (space && pCount === 0) {
            initials.length === 0
                ? (initials = char)
                : (initials = initials[0] + char);
            space = false;
        }
    }
    if (initials === '')
        return `https://${process.env.HostName}/images/anon_avatar.png`;

    random.use(seedrandom(aadObjectId));

    const data = {
        initials,
        index: random.int(0, 13),
    };

    const avatarKey = process.env.AvatarKey;
    if (!avatarKey)
        return `https://${process.env.HostName}/images/anon_avatar.png`;

    const token = jwt.sign(
        data,
        Buffer.from(avatarKey, 'utf8').toString('hex')
    );
    return `https://${process.env.HostName}/avatar/${token}`;
};
