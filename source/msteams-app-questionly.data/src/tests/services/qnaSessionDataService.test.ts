import { IQnASession, QnASession } from "src/schemas/qnaSession";
import mongoose from "mongoose";
import { qnaSessionDataService } from "src/services/qnaSessionDataService";

const sampleUserAADObjId1 = "be36140g-9729-3024-8yg1-147bbi67g2c9";
const sampleTitle = "Weekly QnA Test";
const sampleDescription = "Weekly QnA Test description";
const sampleActivityId = "1234";
const sampleConversationId = "8293";
const sampleTenantId = "11121";
const sampleScopeId = "12311";
const sampleHostUserId = "5f160b862655575054393a0e";
let testSession: IQnASession;

const createDummyQnASession = async (dataEventVersion?: Number) => {
  return await new QnASession({
    title: sampleTitle,
    description: sampleDescription,
    isActive: true,
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

describe("tests optimistic concurrency for qna session document", () => {
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
