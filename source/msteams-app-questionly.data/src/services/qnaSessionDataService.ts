import * as mongoose from "mongoose";
import { ExponentialBackOff, retryWrapper } from "./../utils/retryPolicies";
import {
  IQnASession,
  IQnASession_populated,
  QnASession,
} from "./../schemas/qnaSession";
import { User } from "./../schemas/user";
import { userDataService } from "./userDataService";
import { QnASessionLimitExhausted } from "src/errors/qnaSessionLimitExhausted";

class QnASessionDataService {
  private userDataService;

  constructor(userDataService) {
    this.userDataService = userDataService;
  }

  /**
   * Creates initial QnA session document and stores it in the database
   * @param title - title of QnA
   * @param description - description of QnA
   * @param userName - name of the user who created the QnA
   * @param userAadObjId - AAD Object Id of the user who created the QnA
   * @param activityId - id of the master card message used for proactive updating
   * @param tenantId - id of tenant the bot is running on.
   * @param scopeId - channel id or group chat id
   * @param hostUserId - MS Teams Id of user who created the QnA (used for at-mentions)
   * @param isChannel - whether the QnA session was started in a channel or group chat
   */
  public async createQnASession(
    title: string,
    description: string,
    userName: string,
    userAadObjId: string,
    activityId: string,
    conversationId: string,
    tenantId: string,
    scopeId: string,
    hostUserId: string,
    isChannel: boolean
  ): Promise<{ qnaSessionId: string; hostId: string }> {
    if (process.env.NumberOfActiveAMASessions === undefined) {
      throw new Error("Number of active sessions missing in the settings");
    }
    const currentActiveSessions = await this.getNumberOfActiveSessions(
      conversationId
    );
    if (
      currentActiveSessions >= Number(process.env.NumberOfActiveAMASessions)
    ) {
      throw new QnASessionLimitExhausted(
        `Could not create a new QnA session. There are ${currentActiveSessions} active session(s) already.`
      );
    }
    await this.userDataService.getUserOrCreate(userAadObjId, userName);

    const qnaSession = new QnASession({
      title: title,
      description: description,
      hostId: userAadObjId,
      activityId: activityId,
      conversationId: conversationId,
      tenantId: tenantId,
      isActive: true,
      hostUserId: hostUserId,
      scope: {
        scopeId: scopeId,
        isChannel: isChannel,
      },
    });

    const savedSession: mongoose.MongooseDocument = await retryWrapper(() =>
      qnaSession.save()
    );

    return { qnaSessionId: savedSession._id, hostId: userAadObjId };
  }

  /**
   * Updates the activity id of an existing QnA session
   * @param qnaSessionId - document database id of the QnA session
   * @param activityId - id of the master card message used for proactive updating of the card
   */
  public async updateActivityId(qnaSessionId: string, activityId: string) {
    await retryWrapper(
      () => QnASession.findByIdAndUpdate({ _id: qnaSessionId }, { activityId }),
      new ExponentialBackOff()
    );
  }

  public async getQnASessionData(qnaSessionId: string) {
    const qnaSessionData = await retryWrapper(() =>
      QnASession.findById(qnaSessionId)
        .populate({
          path: "hostId",
          modle: User,
        })
        .exec()
    );

    if (!qnaSessionData) throw new Error("QnA Session not found");

    const _qnaSessionData: IQnASession_populated = (<IQnASession>(
      qnaSessionData
    )).toObject();

    // activity id must be set before this function gets called
    // if (!_qnaSessionData.activityId)
    //     throw new Error('QnA Session `activityId` not found');

    return {
      title: _qnaSessionData.title,
      userName: _qnaSessionData.hostId.userName,
      activityId: _qnaSessionData.activityId,
      conversationId: _qnaSessionData.conversationId,
      userAadObjId: _qnaSessionData.hostId._id,
      description: _qnaSessionData.description,
      dateCreated: _qnaSessionData.dateTimeCreated,
      hostUserId: _qnaSessionData.hostUserId,
      isActive: _qnaSessionData.isActive,
    };
  }

  /**
   * Ends the QnA by changing fields: isActive to false and dateTimeEnded to current time
   * @param qnaSessionId - id of the current QnA session
   * @param conversationId - conversation id
   * @throws Error thrown when database fails to execute changes
   * */
  public async endQnASession(qnaSessionId: string, conversationId: string) {
    await this.isExistingQnASession(qnaSessionId, conversationId);
    const result = await retryWrapper(
      () =>
        QnASession.findByIdAndUpdate(qnaSessionId, {
          $set: { isActive: false, dateTimeEnded: new Date() },
        }).exec(),
      new ExponentialBackOff()
    );

    if (!result) throw new Error("QnA Session not found");
  }

  /**
   * If QnA session exists and belongs to given conversation id, will return true
   * Otherwise, if QnA session doesn't exist, will throw an error.
   * @param qnaTeamsSessionId - id of the current QnA session
   * @param conversationId - conversation id
   * @returns true if qnaTeamsSessionId is in the database
   * @throws Error thrown when database fails to find the qnaTeamsSessionId or qnaTeamsSessionId
   * does not belong to conversationId.
   */
  public async isExistingQnASession(
    qnaTeamsSessionId: string,
    conversationId: string
  ): Promise<boolean> {
    const result: IQnASession = await retryWrapper(() =>
      QnASession.findById(qnaTeamsSessionId)
    );

    if (!result) throw new Error("QnA Session record not found");

    if (result.conversationId.split(";")[0] !== conversationId.split(";")[0]) {
      throw new Error(
        `session ${qnaTeamsSessionId} does not belong to conversation ${conversationId}`
      );
    }

    return true;
  }

  /**
   * Checks if the user is the host for this QnA session, returns true if
   * id matches records, false otherwise
   * @param qnaSessionId - id of the current QnA session
   * @param userAadjObjId - aadObjId of the current user
   * @throws Error when failed to find matching QnA session with the user ID
   */
  public async isHost(
    qnaSessionId: string,
    userAadjObjId: string
  ): Promise<boolean> {
    const result = await retryWrapper<IQnASession[]>(() =>
      QnASession.find({
        _id: qnaSessionId,
        hostId: userAadjObjId,
      }).exec()
    );

    if (result.length == 0) return false;

    return true;
  }

  /**
   * Checks the status of the QnA session, returns true if
   * database records indicate active otherwise returns false
   * @param qnaTeamsSessionId - id of the current QnA session
   */
  public async isActiveQnA(qnaTeamsSessionId: string): Promise<boolean> {
    const result = await retryWrapper<IQnASession | null>(() =>
      QnASession.findById(qnaTeamsSessionId).exec()
    );
    if (!result) throw new Error("Result is empty");

    return result.isActive;
  }

  /**
   * Fetch QnASession document by id
   * @param qnaSessionId - document database id of the QnA session
   */
  public async getQnASession(
    qnaSessionId: string
  ): Promise<IQnASession | null> {
    const result = await retryWrapper<IQnASession | null>(() =>
      QnASession.findById(qnaSessionId).exec()
    );

    return result;
  }

  /**
   * Retrives all QnA sessions for a given conversation Id.
   * @param conversationId - the conversation id for which QnA session data has to be retrived.
   * @return - Array of QnA session data.
   */
  public async getAllQnASessionData(
    conversationId: string
  ): Promise<IQnASession_populated[]> {
    return await retryWrapper<IQnASession_populated[]>(() =>
      QnASession.find({
        conversationId: conversationId,
      })
        .populate({ path: "userId", model: User })
        .exec()
    );
  }

  /**
   * Retrives all active QnA sessions for a given conversation Id.
   * @param conversationId - the conversation id for which QnA session data has to be retrived.
   * @return - Number of active QnA sessions.
   */
  public async getNumberOfActiveSessions(
    conversationId: string
  ): Promise<Number> {
    const result = await retryWrapper<IQnASession_populated[]>(() =>
      QnASession.find({
        conversationId: conversationId,
        isActive: true,
      }).exec()
    );
    return result.length;
  }
}

export const qnaSessionDataService = new QnASessionDataService(userDataService);
