import { IQnASession, QnASession } from "src/schemas/qnaSession";
import mongoose from "mongoose";
import { DocumentNotAvailableForOperationError } from "src/errors/documentNotAvailableForOperationError";
import {
  IQnASessionDataService,
  QnASessionDataService,
} from "src/services/qnaSessionDataService";
import {
  IUserDataService,
  UserDataService,
} from "src/services/userDataService";
import {
  QuestionDataService,
  IQuestionDataService,
} from "src/services/questionDataService";
import { IUser, User } from "src/schemas/user";

const sampleUserAADObjId1 = "be36140g-9729-3024-8yg1-147bbi67g2c9";
const sampleTitle = "Weekly QnA Test";
const sampleDescription = "Weekly QnA Test description";
const sampleActivityId = "1234";
const sampleConversationId = "8293";
const sampleTenantId = "11121";
const sampleScopeId = "12311";
const sampleHostUserId = "5f160b862655575054393a0e";
let testSession: IQnASession;
let userDataService: IUserDataService;
let qnaSessionDataService: IQnASessionDataService;
let questionDataService: IQuestionDataService;
const sampleUserAADObjId2 = "different from obj id 1";
const sampleUserAADObjId3 = "different fr0m obj id 0";
const sampleUserAADObjId4 = "different from obj id 2";
const sampleUserName1 = "Shayan Khalili";
const sampleUserName2 = "Lily Du";
const sampleUserName3 = "Kavin Singh";
const sampleUserName4 = "Sample Name";
const sampleQuestionContent = "Sample Question?";
const sampleQnASessionID = "5f160b862655575054393a0e";
const sampleEndedById = "sampleEndedById";
const sampleEndedByName = "sampleEndedByName";
const sampleEndedByUserId = "sampleEndedByUserId";
let testHost: IUser, testUser: IUser, testUserUpvoting: IUser;

const createDummyQnASession = async (
  dataEventVersion?: Number,
  isActive?: boolean
) => {
  return await new QnASession({
    title: sampleTitle,
    description: sampleDescription,
    isActive: isActive ?? true,
    hostId: sampleUserAADObjId1,
    activityId: sampleActivityId,
    conversationId: sampleConversationId,
    tenantId: sampleTenantId,
    hostUserId: sampleHostUserId,
    scope: {
      scopeId: sampleScopeId,
      isChannel: true,
    },
    dataEventVersion: dataEventVersion ?? 0,
  }).save();
};

describe("tests incrementAndGetDataEventVersion api", () => {
  beforeAll(async () => {
    await mongoose.connect(<string>process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    userDataService = new UserDataService();
    qnaSessionDataService = new QnASessionDataService(userDataService);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    if (testSession) {
      await QnASession.deleteOne({ _id: testSession.id });
    }
  });

  it("update version correctly", async () => {
    const dataEventVersion = 5;
    testSession = await createDummyQnASession(dataEventVersion);
    await qnaSessionDataService.incrementAndGetDataEventVersion(testSession.id);
    const updatedQnaSession = await qnaSessionDataService.getQnASession(
      testSession.id
    );
    expect(updatedQnaSession?.dataEventVersion).toEqual(dataEventVersion + 1);
  });
});

describe("tests updateDateTimeCardLastUpdated api", () => {
  beforeAll(async () => {
    await mongoose.connect(<string>process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    userDataService = new UserDataService();
    qnaSessionDataService = new QnASessionDataService(userDataService);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    if (testSession) {
      await QnASession.deleteOne({ _id: testSession.id });
    }
  });

  it("updates updateDateTimeCardLastUpdated correctly", async () => {
    const dateTimeCardLastUpdated = new Date();
    testSession = await createDummyQnASession();
    await qnaSessionDataService.updateDateTimeCardLastUpdated(
      testSession.id,
      dateTimeCardLastUpdated
    );
    const updatedQnaSession = await qnaSessionDataService.getQnASession(
      testSession.id
    );
    expect(updatedQnaSession?.dateTimeCardLastUpdated).toEqual(
      dateTimeCardLastUpdated
    );
  });
});

describe("tests updateDateTimeNextCardUpdateScheduled api", () => {
  beforeAll(async () => {
    await mongoose.connect(<string>process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    userDataService = new UserDataService();
    qnaSessionDataService = new QnASessionDataService(userDataService);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    if (testSession) {
      await QnASession.deleteOne({ _id: testSession.id });
    }
  });

  it("updates updateDateTimeNextCardUpdateScheduled correctly", async () => {
    const dateTimeNextCardUpdateScheduled = new Date();
    testSession = await createDummyQnASession();
    await qnaSessionDataService.updateDateTimeNextCardUpdateScheduled(
      testSession.id,
      dateTimeNextCardUpdateScheduled
    );
    const updatedQnaSession = await qnaSessionDataService.getQnASession(
      testSession.id
    );
    expect(updatedQnaSession?.dateTimeNextCardUpdateScheduled).toEqual(
      dateTimeNextCardUpdateScheduled
    );
  });
});

describe("tests deleteQnASession api", () => {
  beforeAll(async () => {
    await mongoose.connect(<string>process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("delete document", async () => {
    testSession = await createDummyQnASession();
    await qnaSessionDataService.deleteQnASession(testSession.id);
    const updatedQnaSession = await qnaSessionDataService.getQnASession(
      testSession.id
    );
    expect(updatedQnaSession).toBeNull();
  });
});

describe("tests activateQnASession api", () => {
  beforeAll(async () => {
    await mongoose.connect(<string>process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    if (testSession) {
      await QnASession.deleteOne({ _id: testSession.id });
    }
  });

  it("reactivates qna session", async () => {
    testSession = await createDummyQnASession(0, false);
    await qnaSessionDataService.activateQnASession(testSession.id);
    const updatedQnaSession = await qnaSessionDataService.getQnASession(
      testSession.id
    );
    expect(updatedQnaSession?.isActive).toEqual(true);
    expect(updatedQnaSession?.endedById).toEqual(null);
    expect(updatedQnaSession?.endedByUserId).toEqual(null);
    expect(updatedQnaSession?.dateTimeEnded).toEqual(null);
    expect(updatedQnaSession?.dateTimeEndOperationLockAcquired).toEqual(null);
  });
});

describe("tests lock on session document", () => {
  beforeAll(async () => {
    await mongoose.connect(<string>process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    if (testSession) {
      await QnASession.deleteOne({ _id: testSession.id });
    }

    delete process.env.EndSessionOperationLockValidityInMS;
  });

  it("2nd immediate end operation should fail due to loack acquired by the first process", async () => {
    testSession = await createDummyQnASession(0, true);
    process.env.EndSessionOperationLockValidityInMS = "500000";
    await qnaSessionDataService.endQnASession(
      testSession.id,
      testSession.conversationId,
      "user1id",
      "user1id",
      "user1id"
    );

    try {
      await qnaSessionDataService.endQnASession(
        testSession.id,
        testSession.conversationId,
        "user2id",
        "user2id",
        "user2id"
      );
    } catch (error) {
      expect(
        error instanceof DocumentNotAvailableForOperationError
      ).toBeTruthy();
    }
  });
});

describe("tests optimistic concurrency for qna session document", () => {
  beforeAll(async () => {
    await mongoose.connect(<string>process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    userDataService = new UserDataService();
    qnaSessionDataService = new QnASessionDataService(userDataService);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    if (testSession) {
      await QnASession.deleteOne({ _id: testSession.id });
    }
  });

  it("update stale copy should throw error", async () => {
    const dataEventVersion = 5;
    testSession = await createDummyQnASession(dataEventVersion);
    const fetchedQnaSession1 = await QnASession.findById(testSession.id);
    const fetchedQnaSession2 = await QnASession.findById(testSession.id);

    fetchedQnaSession1.dataEventVersion = 8;
    await fetchedQnaSession1.save();

    fetchedQnaSession2.dataEventVersion = 9;
    await expect(fetchedQnaSession2.save()).rejects.toMatchObject({
      name: "VersionError",
    });
  });
});

describe("tests ama session apis", () => {
  beforeAll(async () => {
    await mongoose.connect(<string>process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    process.env.NumberOfActiveAMASessions = "1";

    userDataService = new UserDataService();
    qnaSessionDataService = new QnASessionDataService(userDataService);
    questionDataService = new QuestionDataService(
      userDataService,
      qnaSessionDataService
    );
  });

  beforeEach(async () => {
    testHost = await userDataService.getUserOrCreate(
      sampleUserAADObjId1,
      sampleUserName1
    );
    testSession = await createDummyQnASession();
    testUser = await userDataService.getUserOrCreate(
      sampleUserAADObjId2,
      sampleUserName2
    );
    testUserUpvoting = await userDataService.getUserOrCreate(
      sampleUserAADObjId3,
      sampleUserName3
    );

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await QnASession.deleteOne({ _id: testSession._id });
    await User.deleteOne({ _id: testHost._id });
    await User.deleteOne({ _id: testUser._id });
    await User.deleteOne({ _id: testUserUpvoting._id });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("can create qna session", async () => {
    (<any>QnASession.collection.createIndex) = jest.fn();

    (<any>qnaSessionDataService.getNumberOfActiveSessions) = jest.fn();
    (<any>(
      qnaSessionDataService.getNumberOfActiveSessions
    )).mockImplementationOnce(() => {
      return 0;
    });
    const data = {
      title: sampleTitle,
      description: sampleDescription,
      userName: sampleUserName1,
      userAadObjId: sampleUserAADObjId1,
      activityId: sampleActivityId,
      conversationId: sampleConversationId,
      tenantId: sampleTenantId,
      hostUserId: sampleHostUserId,
      scopeId: sampleScopeId,
      isChannel: true,
    };

    const result = await qnaSessionDataService.createQnASession({
      title: data.title,
      description: data.description,
      userName: data.userName,
      userAadObjectId: data.userAadObjId,
      activityId: data.activityId,
      conversationId: data.conversationId,
      tenantId: data.tenantId,
      scopeId: data.scopeId,
      hostUserId: data.hostUserId,
      isChannel: data.isChannel,
      isMeetingGroupChat: true,
    });

    expect(result._id).toBeTruthy();
    expect(result.hostId._id).toBe(data.userAadObjId);

    const qnaSessionDoc = await QnASession.findById(result._id);

    expect(qnaSessionDoc).not.toBeNull();
    const doc = (<IQnASession>qnaSessionDoc).toObject();

    const expectedData = {
      title: doc.title,
      description: doc.description,
      userAadObjId: doc.hostId,
      activityId: doc.activityId,
      conversationId: doc.conversationId,
      tenantId: doc.tenantId,
      scopeId: doc.scope.scopeId,
      hostUserId: doc.hostUserId,
      isChannel: doc.scope.isChannel,
      userName: data.userName,
    };

    expect(doc.isActive).toBe(true);
    expect(doc.ttl).toBe(-1);
    expect(doc.dataEventVersion).toBe(0);
    expect(expectedData).toEqual(data);

    await QnASession.deleteOne({ _id: result._id });

    return;
  });

  it("can update activity id", async () => {
    const activityId = "12345";
    await qnaSessionDataService.updateActivityIdAndExpiry(
      testSession._id,
      activityId
    );

    const doc: any = await QnASession.findById(testSession._id);
    expect(doc).not.toBeNull();
    expect(doc._id).toEqual(testSession._id);
    expect(doc.toObject().activityId).toEqual(activityId);
    expect(doc.toObject().ttl).toEqual(-1);
  });

  it("get QnA session data", async () => {
    const qnaSessionData = await qnaSessionDataService.getQnASessionData(
      testSession._id
    );

    expect(qnaSessionData.title).toBe(sampleTitle);
    expect(qnaSessionData.hostId.userName).toBe(sampleUserName1);
    expect(qnaSessionData.activityId).toBe(sampleActivityId);
    expect(qnaSessionData.hostId._id).toBe(sampleUserAADObjId1);
    expect(qnaSessionData.description).toBe(sampleDescription);
    expect(qnaSessionData.isActive).toBe(true);
  });

  it("validate session for non-existing QnA session", async () => {
    await qnaSessionDataService
      .getAndCheckIfQnASessionCanBeUpdated(
        sampleQnASessionID,
        sampleConversationId
      )
      .catch((error) => {
        expect(error).toEqual(new Error("QnA Session record not found"));
      });
  });

  it("validate session for existing QnA session", async () => {
    const data = await qnaSessionDataService.getAndCheckIfQnASessionCanBeUpdated(
      testSession._id,
      sampleConversationId
    );
    expect(data).toBeDefined();
  });

  it("validate existing QnA session not belonging to provided conversation", async () => {
    const randomConversationId = "random";
    await qnaSessionDataService
      .getAndCheckIfQnASessionCanBeUpdated(
        testSession._id,
        randomConversationId
      )
      .catch((error) => {
        expect(error).toEqual(
          new Error(
            `session ${testSession._id} does not belong to conversation ${randomConversationId}`
          )
        );
      });
  });

  it("ending non-existing qna", async () => {
    await qnaSessionDataService
      .endQnASession(
        sampleQnASessionID,
        sampleConversationId,
        sampleEndedById,
        sampleEndedByName,
        sampleEndedByUserId
      )
      .catch((error) => {
        expect(error).toEqual(new Error("QnA Session record not found"));
      });
  });

  it("ending existing qna with no questions", async () => {
    await qnaSessionDataService.endQnASession(
      testSession._id,
      sampleConversationId,
      sampleEndedById,
      sampleEndedByName,
      sampleEndedByUserId
    );

    // get data
    const qnaSessionData: any = await QnASession.findById(testSession._id)
      .exec()
      .catch(() => {
        throw new Error("Retrieving QnA Session details");
      });

    expect(qnaSessionData.isActive).toBe(false);
    expect(qnaSessionData.dateTimeEnded).not.toBe(null);
  });

  it("ending existing qna with a few questions", async () => {
    for (let i = 0; i < 5; i++) {
      const randomString = Math.random().toString(36);
      await questionDataService.createQuestion(
        testSession._id,
        randomString,
        sampleUserName4,
        sampleQuestionContent,
        sampleConversationId
      );
    }

    await qnaSessionDataService.endQnASession(
      testSession._id,
      sampleConversationId,
      sampleEndedById,
      sampleEndedByName,
      sampleEndedByUserId
    );

    // get data
    const qnaSessionData: any = await QnASession.findById(testSession._id)
      .exec()
      .catch(() => {
        throw new Error("Retrieving QnA Session details");
      });

    expect(qnaSessionData.isActive).toBe(false);
    expect(qnaSessionData.dateTimeEnded).not.toBe(null);
  });

  it("ending qna from different conversation", async () => {
    const randomConversationId = "random";
    await qnaSessionDataService
      .endQnASession(
        testSession._id,
        randomConversationId,
        sampleEndedById,
        sampleEndedByName,
        sampleEndedByUserId
      )
      .catch((error) => {
        expect(error).toEqual(
          new Error(
            `session ${testSession._id} does not belong to conversation ${randomConversationId}`
          )
        );
      });
  });

  it("checking if current host is the host", async () => {
    const data = await qnaSessionDataService.isHost(
      testSession._id,
      testSession.hostId
    );
    expect(data).toEqual(true);
  });

  it("checking if random attendee is the host", async () => {
    const data = await qnaSessionDataService.isHost(
      testSession._id,
      sampleUserAADObjId3
    );
    expect(data).toEqual(false);
  });

  it("checking if active QnA is currently active", async () => {
    const data = await qnaSessionDataService.isActiveQnA(testSession._id);
    expect(data).toEqual(true);
  });

  it("checking if inactive QnA is currently active", async () => {
    (<any>QnASession.collection.createIndex) = jest.fn();

    const data = {
      title: sampleTitle,
      description: sampleDescription,
      userName: sampleUserName4,
      userAadObjId: sampleUserAADObjId4,
      activityId: sampleActivityId,
      conversationId: sampleConversationId,
      tenantId: sampleTenantId,
      scopeId: sampleScopeId,
      hostUserId: sampleHostUserId,
      isChannel: true,
    };

    const result = await qnaSessionDataService.createQnASession({
      title: data.title,
      description: data.description,
      userName: data.userName,
      userAadObjectId: data.userAadObjId,
      activityId: data.activityId,
      conversationId: data.conversationId,
      tenantId: data.tenantId,
      scopeId: data.scopeId,
      hostUserId: data.hostUserId,
      isChannel: data.isChannel,
      isMeetingGroupChat: true,
    });

    await qnaSessionDataService.endQnASession(
      result._id,
      sampleConversationId,
      sampleEndedById,
      sampleEndedByName,
      sampleEndedByUserId
    );

    const isActive = await qnaSessionDataService.isActiveQnA(result._id);
    expect(isActive).toEqual(false);

    await QnASession.deleteOne({ _id: result._id });
  });

  it("get all ama sessions", async () => {
    const qnaSessions = await qnaSessionDataService.getAllQnASessionData(
      sampleConversationId
    );
    expect(qnaSessions.length).toEqual(1);
    const qnaSession = qnaSessions[0];
    expect(qnaSession.conversationId).toEqual(sampleConversationId);
    expect(qnaSession._id).toEqual(testSession._id);
    expect(qnaSession.hostId).toEqual(testSession.hostId);
  });

  it("get all ama sessions with invalid conversation Id", async () => {
    const qnaSessions = await qnaSessionDataService.getAllQnASessionData("1");
    expect(qnaSessions.length).toEqual(0);
  });

  it("get all ama sessions", async () => {
    const dummyQnASession = await createDummyQnASession();

    const qnaSessions = await qnaSessionDataService.getAllQnASessionData(
      sampleConversationId
    );
    expect(qnaSessions.length).toEqual(2);
    expect(qnaSessions[0].conversationId).toEqual(sampleConversationId);
    expect(qnaSessions[1].conversationId).toEqual(sampleConversationId);
    expect(qnaSessions[1]._id).toEqual(testSession._id);
    expect(qnaSessions[0]._id).toEqual(dummyQnASession._id);
    expect(qnaSessions[1].hostId).toEqual(testSession.hostId);
    expect(qnaSessions[0].hostId).toEqual(dummyQnASession.hostId);

    await QnASession.deleteOne({ _id: dummyQnASession._id });
  });
});
