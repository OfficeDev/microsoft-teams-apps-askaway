// All the functions to populate the adaptive cards should go in here

import { AdaptiveCard, IAdaptiveCard } from 'adaptivecards';
import * as ACData from 'adaptivecards-templating';
import random from 'random';
import seedrandom from 'seedrandom';
import * as jwt from 'jsonwebtoken';

import { IQuestionPopulatedUser } from 'src/Data/Schemas/Question';

import { mainCard, viewLeaderboardButton } from 'src/adaptive-cards/mainCard';
import { startQnACard } from 'src/adaptive-cards/startQnACard';
import { endQnAConfirmationCard } from 'src/adaptive-cards/endQnAConfirmationCard';

import {
    leaderboardCard,
    leaderboardEmptyCard,
} from 'src/adaptive-cards/leaderboardCard';

import { newQuestionCard } from 'src/adaptive-cards/newQuestionCard';

import { errorCard } from 'src/adaptive-cards/errorCard';
import { mainCardStrings } from 'src/localization/locale';
import { clone } from 'lodash';

import { getAvatarKey } from 'src/util/keyvault';

/**
 * Creates the QnA Master Card
 * @param title - title of QnA
 * @param description - description of QnA
 * @param userName - name of the user who created the QnA session
 * @param qnaSessionId - document database id of the QnA session
 * @param aadObjectId - Id of the user who created the QnA session
 * @param hostUserId - MS Teams Id of user who created the QnA (used for at-mentions)
 * @param ended - whether the QnA session has ended or not
 * @param topQuestionsData - array of questions to display under `Top Questions`
 * @param recentQuestionsData - array of questions sorted by most recently asked first
 * @param totalQuestions - number of questions asked so far in session
 * @returns The QnA Master Card
 */
export const getMainCard = async (
    title: string,
    description: string,
    userName: string,
    qnaSessionId: string,
    aadObjectId: string,
    hostUserId: string,
    ended?: boolean,
    topQuestionsData?: IQuestionPopulatedUser[],
    recentQuestionsData?: IQuestionPopulatedUser[],
    totalQuestions?: number
): Promise<IAdaptiveCard> => {
    const data = {
        title,
        description,
        userName,
        qnaSessionId,
        aadObjectId,
        ended,
    };

    const _processQuestions = async (questions: IQuestionPopulatedUser[]) =>
        await Promise.all(
            questions.map(async (question: IQuestionPopulatedUser) => {
                const questionObject = <any>clone(question);
                questionObject.userId.picture = await getPersonImage(
                    questionObject.userId.userName,
                    question.userId._id
                );
                questionObject.upvotes = questionObject.voters.length;
                questionObject.upvotable =
                    aadObjectId !== questionObject.userId._id;
                return questionObject;
            })
        );

    topQuestionsData = topQuestionsData
        ? await _processQuestions(topQuestionsData)
        : [];

    const _mainCard = mainCard();
    if (ended)
        // remove `Ask a Question` and `End QnA` buttons
        (<any>_mainCard.body)[5].actions = [viewLeaderboardButton()]; // is an ActionSet

    // add at-mention data
    _mainCard.msTeams.entities.push({
        type: 'mention',
        text: `<at>${userName}</at>`,
        mentioned: {
            id: hostUserId,
            name: userName,
        },
    });

    const _numQuestions = totalQuestions ? totalQuestions : 0;
    let mostRecentUser = '',
        nextMostRecentUser = '',
        recentlyAskedString = '';

    if (recentQuestionsData && _numQuestions > 3) {
        mostRecentUser = recentQuestionsData[0].userId.userName;
        for (const item of recentQuestionsData) {
            if (item.userId.userName === mostRecentUser) continue;
            nextMostRecentUser = item.userId.userName;
            break;
        }
        recentlyAskedString = `${mostRecentUser} ${mainCardStrings(
            'recentlyAskedAQuestion'
        )}`;
        if (nextMostRecentUser)
            recentlyAskedString = `${mostRecentUser}, and ${nextMostRecentUser} ${mainCardStrings(
                'recentlyAskedQuestions'
            )}`;
    }

    // it is not wrapped around by _adaptiveCard() because it will remove
    // the `msTeams` property from the master card.
    return new ACData.Template(_mainCard).expand({
        $root: {
            title: title,
            description: description,
            user: userName,
            qnaId: qnaSessionId,
            topQuestions: topQuestionsData,
            userId: aadObjectId,
            data: data,
            leaderboardTitle: ended
                ? mainCardStrings('viewQuestions')
                : mainCardStrings('upvoteQuestions'),
            sessionDetails: ended
                ? `**<at>${userName}</at>** ${mainCardStrings(
                      'endedBy'
                  )}. ${mainCardStrings('noMoreQuestions')}`
                : `**<at>${userName}</at>** ${mainCardStrings('initiatedBy')}`,
            recentlyAsked: recentlyAskedString
                ? `${recentlyAskedString} (${_numQuestions} ${mainCardStrings(
                      'totalQuestions'
                  )})`
                : '',
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
    const template = new ACData.Template(startQnACard()).expand({
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
    const template = new ACData.Template(errorCard()).expand({
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
 * @param theme - Teams theme the user opening the leaderboard is using. Options are: 'default', 'dark', and 'high-contrast'
 * @returns - Adaptive Card for the leaderboard populated with the questions provided.
 */
export const generateLeaderboard = async (
    questionData: IQuestionPopulatedUser[],
    aadObjectId: string,
    qnaSessionId: string,
    isHost: boolean,
    isActiveQnA: boolean,
    theme: string
): Promise<AdaptiveCard> => {
    if (!questionData.length)
        return generateEmptyLeaderboard(qnaSessionId, isHost, isActiveQnA);

    const leaderboardTemplate = leaderboardCard();

    questionData = questionData
        .sort(
            (a: IQuestionPopulatedUser, b: IQuestionPopulatedUser) =>
                a.voters.length - b.voters.length
        )
        .reverse();

    questionData = await Promise.all(
        questionData.map(async (question) => {
            const questionObject = question.toObject();
            questionObject.upvotes = questionObject.voters.length;
            questionObject.upvotable =
                aadObjectId !== questionObject.userId._id;
            questionObject.upvoted = questionObject.voters.includes(
                aadObjectId
            );
            questionObject.userId.picture = await getPersonImage(
                questionObject.userId.userName,
                question.userId._id
            );
            questionObject.isActive = isActiveQnA;

            return questionObject;
        })
    );
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
            upvoteArrow:
                theme === 'default' || theme === 'undefined'
                    ? `https://${process.env.HostName}/images/thumbs_up_default.png`
                    : `https://${process.env.HostName}/images/thumbs_up_dark_and_high_contrast.png`,
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
    const leaderboardTemplate = leaderboardEmptyCard();

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
    const template = new ACData.Template(newQuestionCard()).expand({
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
    const template = new ACData.Template(endQnAConfirmationCard()).expand({
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
    const template = new ACData.Template(newQuestionCard()).expand({
        $root: {
            qnaId: qnaSessionId,
            question: questionContent,
        },
    });
    return _adaptiveCard(template);
};

/**
 * Returns the url for the initlas avatar of the user provided.
 * @param name - Name of the user who's initials avatar url is being retrieved
 * @param aadObjectId - aadObjectId of user who's initials avatar url is being retrieved
 */
export const getPersonImage = async (
    name: string,
    aadObjectId: string
): Promise<string> => {
    if (!name) return `https://${process.env.HostName}/images/anon_avatar.png`;

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

    const avatarKey: string | undefined = await getAvatarKey();

    if (!avatarKey)
        return `https://${process.env.HostName}/images/anon_avatar.png`;

    const token = jwt.sign(
        data,
        Buffer.from(avatarKey, 'utf8').toString('hex'),
        {
            noTimestamp: true,
        }
    );
    return `https://${process.env.HostName}/avatar/${token}`;
};
