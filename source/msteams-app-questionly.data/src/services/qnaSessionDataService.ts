import {
  ExponentialBackOff,
  ifNumber,
  retryWrapper,
  retryWrapperForConcurrency,
} from "./../utils/retryPolicies";
import {
  IQnASession,
  IQnASession_populated,
  QnASession,
} from "./../schemas/qnaSession";
import { IUser, User } from "./../schemas/user";
import { QnASessionLimitExhaustedError } from "../errors/qnaSessionLimitExhaustedError";
import { DocumentNotAvailableForOperationError } from "../errors/documentNotAvailableForOperationError";
import { SessionIsNoLongerActiveError } from "../errors/sessionIsNoLongerActiveError";
import { IUserDataService } from "./userDataService";

export interface IQnASessionDataService {
  createQnASession: (sessionParameters: {
    title: string;
    description: string;
    userName: string;
    userAadObjectId: string;
    activityId: string;
    conversationId: string;
    tenantId: string;
    scopeId: string;
    hostUserId: string;
    isChannel: boolean;
    isMeetingGroupChat: boolean;
  }) => Promise<IQnASession_populated>;
  updateActivityId: (qnaSessionId: string, activityId: string) => Promise<void>;
  getQnASessionData: (qnaSessionId: string) => Promise<IQnASession_populated>;
  endQnASession: (
    qnaSessionId: string,
    conversationId: string,
    endedById: string,
    endedByName: string,
    endedByUserId: string
  ) => Promise<void>;
  isHost: (qnaSessionId: string, userAadjObjId: string) => Promise<boolean>;
  isActiveQnA: (qnaTeamsSessionId: string) => Promise<boolean>;
  getQnASession: (qnaSessionId: string) => Promise<IQnASession | null>;
  getAllQnASessionData: (
    conversationId: string
  ) => Promise<IQnASession_populated[]>;
  getNumberOfActiveSessions: (conversationId: string) => Promise<Number>;
  getAllActiveQnASessionData: (
    conversationId: string
  ) => Promise<IQnASession_populated[]>;
  incrementAndGetDataEventVersion: (qnaSessionId: string) => Promise<Number>;
  updateDateTimeCardLastUpdated: (
    qnaSessionId: string,
    dateTimeCardLastUpdated: Date
  ) => Promise<void>;
  updateDateTimeNextCardUpdateScheduled: (
    qnaSessionId: string,
    dateTimeNextCardUpdateScheduled: Date
  ) => Promise<void>;
  activateQnASession: (qnaSessionId: string) => Promise<void>;
  deleteQnASession: (qnaSessionId: string) => Promise<void>;
  getAndCheckIfQnASessionCanBeUpdated: (
    qnaTeamsSessionId: string,
    conversationId: string
  ) => Promise<IQnASession>;
}

export class QnASessionDataService implements IQnASessionDataService {
  private userDataService: IUserDataService;

  constructor(userDataService: IUserDataService) {
    this.userDataService = userDataService;
  }

  /**
   * Creates initial QnA session document and stores it in the database
   * @param sessionParameters - object with parameters needed in order to create a session
   * title - title of QnA
   * description - description of QnA
   * userName - name of the user who created the QnA
   * userAadObjId - AAD Object Id of the user who created the QnA
   * activityId - id of the master card message used for proactive updating
   * tenantId - id of tenant the bot is running on.
   * scopeId - channel id or group chat id
   * hostUserId - MS Teams Id of user who created the QnA (used for at-mentions)
   * isChannel - whether the QnA session was started in a channel or group chat
   * isMeetingGroupChat - whether the QnA session was started in a meeting chat
   */
  public async createQnASession(sessionParameters: {
    title: string;
    description: string;
    userName: string;
    userAadObjectId: string;
    activityId: string;
    conversationId: string;
    tenantId: string;
    scopeId: string;
    hostUserId: string;
    isChannel: boolean;
    isMeetingGroupChat: boolean;
  }): Promise<IQnASession_populated> {
    if (process.env.NumberOfActiveAMASessions === undefined) {
      throw new Error("Number of active sessions missing in the settings");
    }

    // Meeting chat is restricted to have only one active ama session at a time.
    if (sessionParameters.isMeetingGroupChat) {
      const currentActiveSessions = await this.getNumberOfActiveSessions(
        sessionParameters.conversationId
      );

      if (
        currentActiveSessions >= Number(process.env.NumberOfActiveAMASessions)
      ) {
        throw new QnASessionLimitExhaustedError(
          `Could not create a new QnA session. There are ${currentActiveSessions} active session(s) already.`
        );
      }
    }

    const hostUser: IUser = await this.userDataService.getUserOrCreate(
      sessionParameters.userAadObjectId,
      sessionParameters.userName
    );

    const qnaSession = new QnASession({
      title: sessionParameters.title,
      description: sessionParameters.description,
      hostId: sessionParameters.userAadObjectId,
      activityId: sessionParameters.activityId,
      conversationId: sessionParameters.conversationId,
      tenantId: sessionParameters.tenantId,
      isActive: true,
      hostUserId: sessionParameters.hostUserId,
      scope: {
        scopeId: sessionParameters.scopeId,
        isChannel: sessionParameters.isChannel,
      },
      dataEventVersion: 0,
    });

    const savedSession: IQnASession_populated = await retryWrapper(() =>
      qnaSession.save()
    );
    savedSession.hostId = hostUser;

    return savedSession;
  }

  /**
   * Updates the activity id of an existing QnA session
   * @param qnaSessionId - document database id of the QnA session
   * @param activityId - id of the master card message used for proactive updating of the card
   */
  public async updateActivityId(qnaSessionId: string, activityId: string) {
    await retryWrapperForConcurrency(
      () => QnASession.findByIdAndUpdate({ _id: qnaSessionId }, { activityId }),
      new ExponentialBackOff()
    );
  }

  public async getQnASessionData(
    qnaSessionId: string
  ): Promise<IQnASession_populated> {
    const qnaSessionData = await retryWrapper(() =>
      QnASession.findById(qnaSessionId)
        .populate({
          path: "hostId",
          model: User,
        })
        .populate({
          path: "endedById",
          model: User,
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

    return _qnaSessionData;
  }

  /**
   * Ends the QnA by changing fields: isActive to false and dateTimeEnded to current time
   * @param qnaSessionId - id of the current QnA session
   * @param conversationId - conversation id
   * @throws Error thrown when database fails to execute changes
   * */
  public async endQnASession(
    qnaSessionId: string,
    conversationId: string,
    endedById: string,
    endedByName: string,
    endedByUserId: string
  ) {
    await this.userDataService.getUserOrCreate(endedById, endedByName);

    const result = await retryWrapperForConcurrency(async () => {
      const session = await this.getAndCheckIfQnASessionCanBeUpdated(
        qnaSessionId,
        conversationId
      );

      session.isActive = false;
      session.dateTimeEnded = new Date();
      session.endedById = endedById;
      session.endedByUserId = endedByUserId;
      session.dateTimeEndOperationLockAcquired = new Date();
      return await session.save();
    }, new ExponentialBackOff());

    if (!result) throw new Error("QnA Session not found");
  }

  /**
   * Activates the QnA by changing fields: isActive to true and dateTimeEnded, endedById and endedByUserId to null.
   * (This is used for revert operation, hence does not perform validations.)
   * @param qnaSessionId - id of the current QnA session
   * @throws Error thrown when database fails to execute changes
   * */
  public async activateQnASession(qnaSessionId: string) {
    await retryWrapperForConcurrency(
      () =>
        QnASession.findByIdAndUpdate(qnaSessionId, {
          $set: {
            isActive: true,
            dateTimeEnded: null,
            endedById: null,
            endedByUserId: null,
            dateTimeEndOperationLockAcquired: null,
          },
        }).exec(),
      new ExponentialBackOff()
    );
  }

  /**
   * Checks if QnA session can be updated. Validates following:
   * 1] session exists, 2] session belongs to provided conversation
   * 3] session is not being ended (locked), 4] session is not ended
   * Otherwise, throws appropriate error.
   * @param qnaTeamsSessionId - id of the current QnA session
   * @param conversationId - conversation id
   * @returns session document.
   * @throws appropriate error id end operation can't be performed..
   */
  public async getAndCheckIfQnASessionCanBeUpdated(
    qnaTeamsSessionId: string,
    conversationId: string
  ): Promise<IQnASession> {
    const result: IQnASession = await QnASession.findById(qnaTeamsSessionId);

    if (!result) throw new Error("QnA Session record not found");

    if (result.conversationId.split(";")[0] !== conversationId.split(";")[0]) {
      throw new Error(
        `session ${qnaTeamsSessionId} does not belong to conversation ${conversationId}`
      );
    }

    const endSessionOperationLockValidityInMS = ifNumber(
      process.env.EndSessionOperationLockValidityInMS,
      5000
    );
    const currentTime = new Date().getTime();

    // Check if session document is beging marked as ended by some other process.
    if (
      result.dateTimeEndOperationLockAcquired &&
      currentTime - result.dateTimeEndOperationLockAcquired.getTime() <
        endSessionOperationLockValidityInMS
    ) {
      throw new DocumentNotAvailableForOperationError();
    }

    // If session document is not being marked as ended, and is not active, throw session not active error.
    if (!result.isActive) {
      throw new SessionIsNoLongerActiveError();
    }

    return result;
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
   * Deletes QnASession document by id. (This is used for revert operation, hence does not perform validations.)
   * @param qnaSessionId - document database id of the QnA session
   */
  public async deleteQnASession(qnaSessionId: string): Promise<void> {
    await retryWrapper(() => QnASession.findByIdAndDelete(qnaSessionId).exec());
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
        .sort([["dateTimeCreated", -1]])
        .populate({ path: "userId", model: User })
        .exec()
    );
  }

  /**
   * Retrives number of active QnA sessions for a given conversation Id.
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

  /**
   * Retrives all active QnA sessions for a given conversation Id.
   * @param conversationId - the conversation id for which QnA session data has to be retrived.
   * @return - List of active QnA sessions.
   */
  public async getAllActiveQnASessionData(
    conversationId: string
  ): Promise<IQnASession_populated[]> {
    const result = await retryWrapper<IQnASession_populated[]>(() =>
      QnASession.find({
        conversationId: conversationId,
        isActive: true,
      })
        .populate({ path: "userId", model: User })
        .exec()
    );
    return result;
  }

  /**
   * Gets new version (incremented) for the event and updates new version in DB.
   * @param qnaSessionId - DBID of qnaSession document.
   * @return - Event number.
   */
  public async incrementAndGetDataEventVersion(
    qnaSessionId: string
  ): Promise<Number> {
    const result = await retryWrapperForConcurrency<Number>(async () => {
      let doc = await QnASession.findById(qnaSessionId);
      doc.dataEventVersion = doc.dataEventVersion + 1;
      await doc.save();
      return doc.dataEventVersion;
    }, new ExponentialBackOff());

    return result;
  }

  /**
   * Updates dateTimeCardLastUpdated for qnasession document.
   * @param qnaSessionId - DBID of qnaSession document.
   * @param dateTimeCardLastUpdated - date time when card was last posted.
   */
  public async updateDateTimeCardLastUpdated(
    qnaSessionId: string,
    dateTimeCardLastUpdated: Date
  ): Promise<void> {
    await retryWrapperForConcurrency(() =>
      QnASession.findByIdAndUpdate(qnaSessionId, {
        $set: { dateTimeCardLastUpdated: dateTimeCardLastUpdated },
      }).exec()
    );
  }

  /**
   * Updates dateTimeNextCardUpdateScheduled for qnasession document.
   * @param qnaSessionId - DBID of qnaSession document.
   * @param dateTimeNextCardUpdateScheduled - date time when next card is scheduled.
   */
  public async updateDateTimeNextCardUpdateScheduled(
    qnaSessionId: string,
    dateTimeNextCardUpdateScheduled: Date
  ): Promise<void> {
    await retryWrapperForConcurrency(() =>
      QnASession.findByIdAndUpdate(qnaSessionId, {
        $set: {
          dateTimeNextCardUpdateScheduled: dateTimeNextCardUpdateScheduled,
        },
      }).exec()
    );
  }
}
