import {
  ExponentialBackOff,
  retryWrapper,
  retryWrapperForConcurrency,
} from "./../utils/retryPolicies";
import { IQnASession, QnASession } from "./../schemas/qnaSession";
import {
  IQuestion,
  IQuestionPopulatedUser,
  Question,
} from "./../schemas/question";
import { User } from "./../schemas/user";
import { qnaSessionDataService } from "./qnaSessionDataService";
import { userDataService } from "./userDataService";

export class QuestionDataService {
  private qnaSessionDataService;
  private userDataService;

  constructor(userDataService, qnaSessionDataService) {
    this.userDataService = userDataService;
    this.qnaSessionDataService = qnaSessionDataService;
  }

  /**
   * Writes a new question to the database.
   * @param qnaTeamsSessionId - id of the current QnA session
   * @param userAadObjId - AAD Object ID of user
   * @param userTeamsName - Name of user on Teams
   * @param questionContent - Question asked by user
   * @param conversationId - conversation id
   * @returns Returns created document
   * @throws Error thrown when database fails to save the question
   */
  public async createQuestion(
    qnaTeamsSessionId: string,
    userAadObjId: string,
    userTeamsName: string,
    questionContent: string,
    conversationId: string
  ): Promise<IQuestion> {
    await this.userDataService.getUserOrCreate(userAadObjId, userTeamsName);
    await this.qnaSessionDataService.isExistingActiveQnASession(
      qnaTeamsSessionId,
      conversationId
    );

    const question = new Question({
      qnaSessionId: qnaTeamsSessionId,
      userId: userAadObjId,
      content: questionContent,
      isAnswered: false,
    });

    const savedQuestion: IQuestion = await retryWrapper(
      () => question.save(),
      new ExponentialBackOff()
    );

    return savedQuestion;
  }

  /**
   * Returns all the questions under an QnA with the details of the users filled.
   * @param qnaSessionId - the DBID of the QnA session from which to retrieve the questions.
   * @returns - Array of Question documents under the QnA.
   * @throws - Error thrown when finding questions or populating userId field of question documents fails.
   */
  public async getQuestionData(
    qnaSessionId: string
  ): Promise<IQuestionPopulatedUser[]> {
    const questionData: IQuestion[] = await retryWrapper<IQuestion[]>(() =>
      Question.find({
        qnaSessionId: qnaSessionId,
      })
        .populate({ path: "userId", model: User })
        .exec()
    );
    if (this.isIQuestion_populatedUserArray(questionData))
      return <IQuestionPopulatedUser[]>questionData;
    else {
      throw new Error("Incorrect type received for questions array");
    }
  }

  /**
   * Retrives top N questions with the highest number of votes.
   * @param qnaSessionId - the DBID of the QnA session from which to retrieve the questions.
   * @param topN - number of questions to retrieve. Must be positive.
   * @returns - Array of Question documents in the QnA and total questions in QnA.
   */
  public async getQuestions(
    qnaSessionId: string,
    topN?: number
  ): Promise<{
    topQuestions?: IQuestionPopulatedUser[];
    recentQuestions?: IQuestionPopulatedUser[];
    numQuestions: number;
  }> {
    const questionData = await this.getQuestionData(qnaSessionId);
    let voteSorted;

    // most recent question comes first at index 0
    const recentSorted = questionData
      .map((value) => value.toObject())
      .sort(
        (a: any, b: any) =>
          new Date(b.dateTimeCreated).getTime() -
          new Date(a.dateTimeCreated).getTime()
      );

    if (topN)
      // descending order, so [0, 1, 2] => [2, 1, 0]
      voteSorted = questionData
        .map((value) => value.toObject())
        .sort((a: any, b: any) => {
          // sort by votes first then most recent
          const diff = b.voters.length - a.voters.length;
          if (diff !== 0) return diff;
          return (
            new Date(b.dateTimeCreated).getTime() -
            new Date(a.dateTimeCreated).getTime()
          );
        })
        .slice(0, topN);

    return {
      topQuestions: topN ? voteSorted : null,
      recentQuestions: recentSorted,
      numQuestions: questionData.length,
    };
  }

  /**
   * Adds the aadObjectId of the user upvoting the question to the 'voters' array of that question document if the user has not already upvoted the question.
   * Otherwise, removes their aadObjectId from the voters list to reflect taking back their upvote.
   * @param questionId - The DBID of the question document for the question being upvoted.
   * @param aadObjectId - The aadObjectId of the user upvoting the question.
   * @param name - The name of the user upvoting the question, used for creating a new User document if one doesn't exist.
   * @returns - question document and boolean (true if question is upvoted).
   */
  public async updateUpvote(
    questionId: string,
    aadObjectId: string,
    name: string
  ): Promise<{ question: IQuestion; upvoted: Boolean }> {
    await this.userDataService.getUserOrCreate(aadObjectId, name);

    return await retryWrapperForConcurrency<{
      question: IQuestion;
      upvoted: Boolean;
    }>(async () => {
      const question: IQuestion = <IQuestion>(
        await Question.findById(questionId)
      );

      const qnaSession: IQnASession = <IQnASession>(
        await QnASession.findById(question.qnaSessionId)
      );

      let upvoted = false;

      if (qnaSession.isActive) {
        if (question.voters.includes(aadObjectId))
          question.voters.splice(question.voters.indexOf(aadObjectId), 1);
        else {
          question.voters.push(aadObjectId);
          upvoted = true;
        }

        await question.save();
      }

      return { question: question, upvoted: upvoted };
    }, new ExponentialBackOff());
  }

  /**
   * Returns question corresponding to questionId if it belongs to given session and conversation.
   * @param conversationId - conversation id corresponding to session.
   * @param sessionId - The DBID of the session document.
   * @param questionId - The DBID of the question document.
   * @returns - question document.
   * @throws - exception if question validation fails.
   */
  private async getAndValidateQuestion(
    conversationId: string,
    sessionId: string,
    questionId: string
  ): Promise<IQuestionPopulatedUser> {
    const session = await qnaSessionDataService.getQnASession(sessionId);

    if (!session) {
      throw new Error(`Invalid session id ${sessionId}`);
    } else if (session.conversationId !== conversationId) {
      throw new Error(
        `session ${sessionId} does not belong to conversation ${conversationId}`
      );
    } else if (!session.isActive) {
      throw new Error(`session ${sessionId} is not active`);
    }

    const question = await retryWrapper<IQuestionPopulatedUser>(() =>
      Question.findById(questionId).populate({ path: "userId", model: User })
    );

    if (!question) {
      throw new Error(`Invalid question id ${questionId}`);
    } else if (question.qnaSessionId.toString() !== sessionId) {
      throw new Error(
        `question ${questionId} does not belong to session ${sessionId}`
      );
    }

    return question;
  }

  /**
   * Adds the aadObjectId of the user upvoting the question to the 'voters' array of that question document if the user has not already upvoted the question.
   * @param conversationId - conversation id corresponding to session.
   * @param sessionId - The DBID of the session document.
   * @param questionId - The DBID of the question document for the question being upvoted.
   * @param aadObjectId - The aadObjectId of the user upvoting the question.
   * @param name - The name of the user upvoting the question, used for creating a new User document if one doesn't exist.
   * @returns - user document.
   * @throws - exception if question validation fails.
   */
  public async upVoteQuestion(
    conversationId: string,
    sessionId: string,
    questionId: string,
    aadObjectId: string,
    name: string
  ): Promise<IQuestionPopulatedUser> {
    await this.userDataService.getUserOrCreate(aadObjectId, name);

    return await retryWrapperForConcurrency<IQuestionPopulatedUser>(
      async () => {
        const question = await this.getAndValidateQuestion(
          conversationId,
          sessionId,
          questionId
        );

        if (question.userId._id === aadObjectId) {
          throw new Error("User cannot upvote/ downvote own question");
        }

        if (!question.voters.includes(aadObjectId)) {
          question.voters.push(aadObjectId);
          await question.save();
        }

        return question;
      }
    );
  }

  /**
   * Removes the aadObjectId of the user downvoting the question from the 'voters' array of that question document if the user has upvoted the question.
   * @param conversationId - conversation id corresponding to session.
   * @param sessionId - The DBID of the session document.
   * @param questionId - The DBID of the question document for the question being upvoted.
   * @param aadObjectId - The aadObjectId of the user upvoting the question.
   * @returns - user document.
   * @throws - exception if question validation fails.
   */
  public async downVoteQuestion(
    conversationId: string,
    sessionId: string,
    questionId: string,
    aadObjectId: string
  ): Promise<IQuestionPopulatedUser> {
    return await retryWrapperForConcurrency<IQuestionPopulatedUser>(
      async () => {
        const question = await this.getAndValidateQuestion(
          conversationId,
          sessionId,
          questionId
        );

        if (question.userId._id === aadObjectId) {
          throw new Error("User cannot upvote/ downvote own question");
        }

        if (question.voters.includes(aadObjectId)) {
          question.voters.splice(question.voters.indexOf(aadObjectId), 1);
          await question.save();
        }

        return question;
      }
    );
  }

  /**
   * Updates question as answered.
   * @param conversationId - conversation id corresponding to session.
   * @param sessionId - The DBID of the session document.
   * @param questionId - The DBID of the question document for the question being upvoted.
   * @returns - user document.
   * @throws - exception if question validation fails.
   */
  public async markQuestionAsAnswered(
    conversationId: string,
    sessionId: string,
    questionId: string
  ): Promise<IQuestionPopulatedUser> {
    return await retryWrapperForConcurrency<IQuestionPopulatedUser>(
      async () => {
        const question = await this.getAndValidateQuestion(
          conversationId,
          sessionId,
          questionId
        );

        if (!question.isAnswered) {
          question.isAnswered = true;
          await question.save();
        }

        return question;
      }
    );
  }

  /**
   * Type guard to check if an array of Question documents has the userId field populated or not. This type guard should be made stronger.
   * @param questions - array of Question documents
   */
  private isIQuestion_populatedUserArray(
    questions: IQuestionPopulatedUser[] | IQuestion[]
  ): questions is IQuestionPopulatedUser[] {
    const unknownUser = new User({
      _id: "unknownUser",
      userName: "Unknown User",
    });

    for (let i = 0; i < questions.length; i++) {
      if (questions[i].userId === null) questions[i].userId = unknownUser;
    }
    return true;
  }
}

export const questionDataService = new QuestionDataService(
  userDataService,
  qnaSessionDataService
);
