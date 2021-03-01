// All the functions to populate the adaptive cards should go in here

import { IAdaptiveCard } from "adaptivecards";
import * as ACData from "adaptivecards-templating";
import random from "random";
import seedrandom from "seedrandom";
import * as jwt from "jsonwebtoken";

import {
  IQuestionPopulatedUser,
  IQuestionDataService,
  IQnASessionDataService,
} from "msteams-app-questionly.data";
import { mainCard, viewLeaderboardButton } from "./maincard";
import { initLocalization, mainCardStrings } from "../localization/locale";
import { CardConstants } from "./cardConstants";

/**
 * Creates the QnA Master Card
 * @param title - title of QnA
 * @param description - description of QnA
 * @param userName - name of the user who created the QnA session
 * @param qnaSessionId - document database id of the QnA session
 * @param aadObjectId - Id of the user who created the QnA session
 * @param hostUserId - MS Teams Id of user who created the QnA (used for at-mentions)
 * @param avatarKey - avatar key
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
  avatarKey?: string,
  ended?: boolean,
  topQuestionsData?: IQuestionPopulatedUser[],
  recentQuestionsData?: IQuestionPopulatedUser[],
  totalQuestions?: number,
  endedById?: string,
  endedByName?: string,
  endedByUserId?: string
): Promise<IAdaptiveCard> => {
  // Initialize localization (this is no ops if it's already initialized).
  await initLocalization();

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
        const questionObject = <any>question;
        questionObject.userId.picture = await getPersonImage(
          questionObject.userId.userName,
          question.userId._id,
          avatarKey
        );
        questionObject.upvotes = questionObject.voters.length;
        questionObject.upvotable = aadObjectId !== questionObject.userId._id;
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
  if (ended && endedByName) {
    _mainCard.msTeams.entities.push({
      type: "mention",
      text: getAtMentionMarkDown(endedByName),
      mentioned: {
        id: endedByUserId,
        name: endedByName,
      },
    });
  } else {
    _mainCard.msTeams.entities.push({
      type: "mention",
      text: getAtMentionMarkDown(userName),
      mentioned: {
        id: hostUserId,
        name: userName,
      },
    });
  }

  const _numQuestions = totalQuestions ? totalQuestions : 0;
  let mostRecentUser = "",
    nextMostRecentUser = "",
    recentlyAskedString = "";

  if (
    recentQuestionsData &&
    _numQuestions >= CardConstants.minNumberOfQuestionsToShowRecentQuestionData
  ) {
    mostRecentUser = recentQuestionsData[0].userId.userName;
    for (const item of recentQuestionsData) {
      if (item.userId.userName === mostRecentUser) continue;
      nextMostRecentUser = item.userId.userName;
      break;
    }
    recentlyAskedString = mainCardStrings("recentlyAskedAQuestion", {
      user1: mostRecentUser,
      questionCount: _numQuestions,
    });

    if (nextMostRecentUser)
      recentlyAskedString = mainCardStrings("recentlyAskedQuestions", {
        user1: mostRecentUser,
        user2: nextMostRecentUser,
        questionCount: _numQuestions,
      });
  }

  // it is not wrapped around by _adaptiveCard() because it will remove
  // the `msTeams` property from the master card.
  return new ACData.Template(_mainCard).expand({
    $root: {
      title: title,
      description: description,
      user: ended ? endedByName : userName,
      qnaId: qnaSessionId,
      topQuestions: topQuestionsData,
      userId: ended ? endedById : aadObjectId,
      data: data,
      leaderboardTitle: ended
        ? mainCardStrings("viewQuestions")
        : mainCardStrings("upvoteQuestions"),
      sessionDetails:
        ended && endedByName
          ? mainCardStrings("sessionEndedNoMoreQuestions", {
              user: getAtMentionInBoldMarkDown(endedByName),
            })
          : mainCardStrings("initiatedBy", {
              user: getAtMentionInBoldMarkDown(userName),
            }),
      recentlyAsked: recentlyAskedString,
    },
  });
};

/**
 * Get mark down syntax to at mention a user.
 * @param userName - user name.
 */
const getAtMentionMarkDown = (userName: string): string => {
  return `<at>${userName}</at>`;
};

/**
 * Get mark down syntax to bold the text.
 * @param text - text that needs to be rendered bold.
 */
const getTextWithBoldMarkDown = (text: string): string => {
  return `**${text}**`;
};

/**
 * Get mark down syntax to at mention a user that needs to rendered in bold.
 * @param userName - user name.
 */
const getAtMentionInBoldMarkDown = (userName: string): string => {
  return getTextWithBoldMarkDown(getAtMentionMarkDown(userName));
};

export const getUpdatedMainCard = async (
  qnaSessionDataService: IQnASessionDataService,
  questionDataService: IQuestionDataService,
  qnaSessionId: string,
  ended = false,
  avatarKey?: string
): Promise<{ card: IAdaptiveCard; activityId?: string }> => {
  const qnaSessionData = await qnaSessionDataService.getQnASessionData(
    qnaSessionId
  );

  // eslint-disable-next-line prefer-const
  const {
    topQuestions,
    recentQuestions,
    numQuestions,
  } = await questionDataService.getQuestionsCountWithRecentAndTopNQuestions(
    qnaSessionId,
    3
  );

  // generate and return maincard
  return {
    card: await getMainCard(
      qnaSessionData.title,
      qnaSessionData.description,
      qnaSessionData.hostId.userName,
      qnaSessionId,
      qnaSessionData.hostId._id,
      qnaSessionData.hostUserId,
      avatarKey,
      ended || !qnaSessionData.isActive,
      topQuestions,
      recentQuestions,
      numQuestions,
      qnaSessionData.endedById?._id,
      qnaSessionData.endedById?.userName,
      qnaSessionData.endedByUserId
    ),
    activityId: qnaSessionData.activityId,
  };
};

/**
 * Returns the url for the initlas avatar of the user provided.
 * @param name - Name of the user who's initials avatar url is being retrieved
 * @param aadObjectId - aadObjectId of user who's initials avatar url is being retrieved
 * @param avatarKey - avatar key
 */
export const getPersonImage = async (
  name: string,
  aadObjectId: string,
  avatarKey?: string
): Promise<string> => {
  if (!name) return `https://${process.env.HostName}/images/anon_avatar.png`;

  let initials = "";
  let space = true;
  let pCount = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name[i].toUpperCase();
    if (char === " ") {
      space = true;
    } else if (char === "(") {
      pCount++;
      space = false;
    } else if (char === ")") {
      pCount--;
      space = false;
    } else if (space && pCount === 0) {
      initials.length === 0
        ? (initials = char)
        : (initials = initials[0] + char);
      space = false;
    }
  }
  if (initials === "")
    return `https://${process.env.HostName}/images/anon_avatar.png`;

  random.use(seedrandom(aadObjectId));

  const data = {
    initials,
    index: random.int(0, 13),
  };

  if (!avatarKey)
    return `https://${process.env.HostName}/images/anon_avatar.png`;

  const token = jwt.sign(data, Buffer.from(avatarKey, "utf8").toString("hex"), {
    noTimestamp: true,
  });
  return `https://${process.env.HostName}/avatar/${token}`;
};
