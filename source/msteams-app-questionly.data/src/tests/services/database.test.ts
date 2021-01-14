/* eslint-disable @typescript-eslint/tslint/config */
import mongoose from "mongoose";
import { QnASession, IQnASession } from "src/schemas/qnASession";
import { Question, IQuestion } from "src/schemas/question";
import { User } from "src/schemas/user";
import crypto from "crypto";
import { qnaSessionDataService } from "src/services/qnaSessionDataService";
import { questionDataService } from "src/services/questionDataService";
import { userDataService } from "src/services/userDataService";

let testHost, testQnASession, testUser, testUserUpvoting;

const sampleUserAADObjId1 = "be36140g-9729-3024-8yg1-147bbi67g2c9";
const sampleUserAADObjId2 = "different from obj id 1";
const sampleUserAADObjId3 = "different fr0m obj id 0";
const sampleUserAADObjId4 = "different from obj id 2";
const sampleUserName1 = "Shayan Khalili";
const sampleUserName2 = "Lily Du";
const sampleUserName3 = "Kavin Singh";
const sampleUserName4 = "Sample Name";
const sampleQuestionContent = "Sample Question?";
const sampleTitle = "Weekly QnA Test";
const sampleDescription = "Weekly QnA Test description";
const sampleActivityId = "1234";
const sampleConversationId = "8293";
const sampleTenantId = "11121";
const sampleScopeId = "12311";
const sampleQnASessionID = "5f160b862655575054393a0e";
const sampleHostUserId = "5f160b862655575054393a0e";
const sampleEndedById = "sampleEndedById";
const sampleEndedByName = "sampleEndedByName";
const sampleEndedByUserId = "sampleEndedByUserId";

const createDummyQnASession = async () => {
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
  }).save();
};

beforeAll(async () => {
  await mongoose.connect(<string>process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });
  process.env.NumberOfActiveAMASessions = "1";
});

beforeEach(async () => {
  testHost = await new User({
    _id: sampleUserAADObjId1,
    userName: sampleUserName1,
  }).save();

  testQnASession = await createDummyQnASession();

  testUser = await new User({
    _id: sampleUserAADObjId2,
    userName: sampleUserName2,
  }).save();

  testUserUpvoting = await new User({
    _id: sampleUserAADObjId3,
    userName: sampleUserName3,
  }).save();

  jest.clearAllMocks();
});

afterEach(async () => {
  await QnASession.remove({ _id: testQnASession._id });
  await User.remove({ _id: testHost._id });
  await User.remove({ _id: testUser._id });
  await User.remove({ _id: testUserUpvoting._id });
});

afterAll(async () => {
  await mongoose.connection.close();
});

test("can create qna session", async () => {
  (<any>qnaSessionDataService.getNumberOfActiveSessions) = jest.fn();
  (<any>qnaSessionDataService.getNumberOfActiveSessions).mockImplementationOnce(
    () => {
      return 0;
    }
  );
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
  expect(doc.dataEventVersion).toBe(0);
  expect(expectedData).toEqual(data);

  await QnASession.remove({ _id: result._id });

  return;
});

test("can update activity id", async () => {
  const activityId = "12345";
  await qnaSessionDataService.updateActivityId(testQnASession._id, activityId);

  const doc: any = await QnASession.findById(testQnASession._id);
  expect(doc).not.toBeNull();
  expect(doc._id).toEqual(testQnASession._id);
  expect(doc.toObject().activityId).toEqual(activityId);
});

test("get QnA session data", async () => {
  const qnaSessionData = await qnaSessionDataService.getQnASessionData(
    testQnASession._id
  );

  expect(qnaSessionData.title).toBe(sampleTitle);
  expect(qnaSessionData.hostId.userName).toBe(sampleUserName1);
  expect(qnaSessionData.activityId).toBe(sampleActivityId);
  expect(qnaSessionData.hostId._id).toBe(sampleUserAADObjId1);
  expect(qnaSessionData.description).toBe(sampleDescription);
  expect(qnaSessionData.isActive).toBe(true);
});

test("retrieve most recent/top questions with three questions", async () => {
  const doc: any = await QnASession.findById(testQnASession._id);
  expect(doc).not.toBeNull();

  // create a new questions
  const questions: any = [
    {
      qnaSessionId: testQnASession._id,
      userId: testUser._id,
      content: "This is test question 1",
      isAnswered: false,
      voters: [
        {
          _id: "456",
          userName: "Khayan Shalili",
        },
        {
          _id: "456",
          userName: "Khayan Shalili",
        },
      ],
    },
    {
      qnaSessionId: testQnASession._id,
      userId: testUser._id,
      content: "This is test question 2",
      isAnswered: false,
      voters: [],
    },
    {
      qnaSessionId: testQnASession._id,
      userId: testUser._id,
      content: "This is test question 3",
      isAnswered: false,
      voters: [
        {
          _id: "456",
          userName: "Khayan Shalili",
        },
      ],
    },
  ];

  const _sleep = (ms) =>
    new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
  questions[1] = await new Question(questions[1]).save();
  await _sleep(50);
  questions[0] = await new Question(questions[0]).save();
  await _sleep(1000);
  questions[2] = await new Question(questions[2]).save();

  const results = await questionDataService.getQuestions(testQnASession._id, 3);
  const topQuestions: any = results.topQuestions;
  const recentQuestions: any = results.recentQuestions;
  const numQuestions = results.numQuestions;

  expect(topQuestions).not.toBe(null);
  expect(recentQuestions).not.toBe(null);
  expect(numQuestions).toEqual(3);

  expect(topQuestions[0]._id).toEqual(questions[0]._id);
  expect(topQuestions[1]._id).toEqual(questions[2]._id);
  expect(topQuestions[2]._id).toEqual(questions[1]._id);

  expect(recentQuestions[0]._id).toEqual(questions[2]._id);
  expect(recentQuestions[1]._id).toEqual(questions[0]._id);
  expect(recentQuestions[2]._id).toEqual(questions[1]._id);

  // cleanup
  await Question.remove({ qnaSessionId: testQnASession._id });
});

test("retrieve most top questions with no votes should be most recent questions", async () => {
  const doc: any = await QnASession.findById(testQnASession._id);
  expect(doc).not.toBeNull();

  // create a new questions
  const questions: any = [
    {
      qnaSessionId: testQnASession._id,
      userId: testUser._id,
      content: "This is test question 1",
      isAnswered: false,
      voters: [],
    },
    {
      qnaSessionId: testQnASession._id,
      userId: testUser._id,
      content: "This is test question 2",
      isAnswered: false,
      voters: [],
    },
    {
      qnaSessionId: testQnASession._id,
      userId: testUser._id,
      content: "This is test question 3",
      isAnswered: false,
      voters: [],
    },
  ];

  const _sleep = (ms) =>
    new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
  questions[1] = await new Question(questions[1]).save();
  await _sleep(50);
  questions[0] = await new Question(questions[0]).save();
  await _sleep(1000);
  questions[2] = await new Question(questions[2]).save();

  const results = await questionDataService.getQuestions(testQnASession._id, 3);
  const topQuestions: any = results.topQuestions;
  const numQuestions = results.numQuestions;

  expect(topQuestions).not.toBe(null);
  expect(numQuestions).toEqual(3);

  expect(topQuestions[0]._id).toEqual(questions[2]._id);
  expect(topQuestions[1]._id).toEqual(questions[0]._id);
  expect(topQuestions[2]._id).toEqual(questions[1]._id);

  // cleanup
  await Question.remove({ qnaSessionId: testQnASession._id });
});

test("retrieve most top questions with some votes should be most recent questions", async () => {
  const doc: any = await QnASession.findById(testQnASession._id);
  expect(doc).not.toBeNull();

  // create a new questions
  const questions: any = [
    {
      qnaSessionId: testQnASession._id,
      userId: testUser._id,
      content: "This is test question 1",
      isAnswered: false,
      voters: [
        {
          _id: "456",
          userName: "Khayan Shalili",
        },
      ],
    },
    {
      qnaSessionId: testQnASession._id,
      userId: testUser._id,
      content: "This is test question 2",
      isAnswered: false,
      voters: [],
    },
    {
      qnaSessionId: testQnASession._id,
      userId: testUser._id,
      content: "This is test question 3",
      isAnswered: false,
      voters: [],
    },
  ];

  const _sleep = (ms) =>
    new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
  questions[1] = await new Question(questions[1]).save();
  await _sleep(50);
  questions[0] = await new Question(questions[0]).save();
  await _sleep(1000);
  questions[2] = await new Question(questions[2]).save();

  const results = await questionDataService.getQuestions(testQnASession._id, 3);
  const topQuestions: any = results.topQuestions;
  const numQuestions = results.numQuestions;

  expect(topQuestions).not.toBe(null);
  expect(numQuestions).toEqual(3);

  expect(topQuestions[0]._id).toEqual(questions[0]._id);
  expect(topQuestions[1]._id).toEqual(questions[2]._id);
  expect(topQuestions[2]._id).toEqual(questions[1]._id);

  // cleanup
  await Question.remove({ qnaSessionId: testQnASession._id });
});

test("retrieve most recent/top questions with no questions", async () => {
  const doc: any = await QnASession.findById(testQnASession._id);
  expect(doc).not.toBeNull();

  const results = await questionDataService.getQuestions(testQnASession._id, 3);
  const topQuestions: any = results.topQuestions;
  const recentQuestions: any = results.recentQuestions;
  const numQuestions: any = results.numQuestions;

  expect(topQuestions).toEqual([]);
  expect(recentQuestions).toEqual([]);
  expect(numQuestions).toEqual(0);
  // cleanup
  await Question.remove({ qnaSessionId: testQnASession._id });
});

test("retrieve question data in empty QnA", async () => {
  const questionData = await questionDataService.getQuestionData(
    testQnASession._id
  );
  expect(questionData).toEqual([]);
});

test("retrieve question data in non-empty QnA", async () => {
  const questions: IQuestion[] = [
    new Question({
      qnaSessionId: testQnASession._id,
      userId: testUser._id,
      content: "This is test question 1",
      isAnswered: false,
      voters: [],
    }),
    new Question({
      qnaSessionId: testQnASession._id,
      userId: testUser._id,
      content: "This is test question 2",
      isAnswered: false,
      voters: [],
    }),
  ];

  await questions[0].save();
  await questions[1].save();

  const questionData = await questionDataService.getQuestionData(
    testQnASession._id
  );

  expect(questionData[0]._id).toEqual(questions[0]._id);
  expect(questionData[1]._id).toEqual(questions[1]._id);

  await Question.remove({ _id: questionData[0]._id });
  await Question.remove({ _id: questionData[1]._id });
});

test("create new user", async () => {
  const data = await userDataService.getUserOrCreate(
    sampleUserAADObjId1,
    sampleUserName1
  );
  expect(data).toBeDefined();
  expect(data.userName).toEqual(sampleUserName1);
  expect(data.id).toEqual(sampleUserAADObjId1);
});

test("update existing user", async () => {
  const randomString = crypto.randomBytes(36).toString("hex");
  const data = await userDataService.getUserOrCreate(
    sampleUserAADObjId1,
    randomString
  );
  expect(data).toBeDefined();
  expect(data.userName).toEqual(randomString);
  expect(data.id).toEqual(sampleUserAADObjId1);
});

test("new question with existing user in existing QnA session", async () => {
  const question = await questionDataService.createQuestion(
    testQnASession._id,
    testUser._id,
    testUser.userName,
    sampleQuestionContent,
    sampleConversationId
  );

  expect(question).toBeDefined();
  const doc: any = await Question.findById(question.id);
  expect(doc).not.toBeNull();
  expect(doc.id).toEqual(question.id);
  expect(doc.toObject().content).toEqual(sampleQuestionContent);
});

test("new question with new user in existing QnA session", async () => {
  const question = await questionDataService.createQuestion(
    testQnASession._id,
    sampleUserAADObjId4,
    sampleUserName4,
    sampleQuestionContent,
    sampleConversationId
  );
  expect(question.id).toBeDefined();

  const doc: any = await Question.findById(question.id);
  expect(doc).not.toBeNull();
  expect(doc.id).toEqual(question.id);
  expect(doc.toObject().content).toEqual(sampleQuestionContent);
});

test("new question with existing user in non-existing QnA session", async () => {
  await questionDataService
    .createQuestion(
      sampleQnASessionID,
      sampleUserAADObjId4,
      sampleUserName4,
      sampleQuestionContent,
      sampleConversationId
    )
    .catch((error) => {
      expect(error).toEqual(new Error("QnA Session record not found"));
    });
});

test("get non-existing QnA session", async () => {
  await qnaSessionDataService
    .isExistingQnASession(sampleQnASessionID, sampleConversationId)
    .catch((error) => {
      expect(error).toEqual(new Error("QnA Session record not found"));
    });
});

test("get existing QnA session", async () => {
  const data = await qnaSessionDataService.isExistingQnASession(
    testQnASession._id,
    sampleConversationId
  );
  expect(data).toEqual(true);
});

test("get existing QnA session not belonging to provided conversation", async () => {
  const randomConversationId = "random";
  await qnaSessionDataService
    .isExistingQnASession(testQnASession._id, randomConversationId)
    .catch((error) => {
      expect(error).toEqual(
        new Error(
          `session ${testQnASession._id} does not belong to conversation ${randomConversationId}`
        )
      );
    });
});

test("upvote question that has not been upvoted yet with existing user", async () => {
  const newQuestion = new Question({
    qnaSessionId: testQnASession._id,
    userId: testUser._id,
    content: "This is a question to test upvotes?",
    isAnswered: false,
    voters: [],
  });

  await newQuestion.save();

  const response = await questionDataService.updateUpvote(
    newQuestion._id,
    testUserUpvoting._id,
    testUserUpvoting.userName
  );

  expect(response.question.voters).toContain(testUserUpvoting._id);

  await Question.remove(response.question);
  await User.remove(testUserUpvoting);
});

test("upvote question that has already been upvoted with existing user", async () => {
  const newQuestion = new Question({
    qnaSessionId: testQnASession._id,
    userId: testUser._id,
    content: "This is a question to test upvotes?",
    isAnswered: false,
    voters: [],
  });

  await newQuestion.save();

  let response = await questionDataService.updateUpvote(
    newQuestion._id,
    testUserUpvoting._id,
    testUserUpvoting.userName
  );

  expect(response.question.voters).toContain(testUserUpvoting._id);

  response = await questionDataService.updateUpvote(
    newQuestion._id,
    testUserUpvoting._id,
    testUserUpvoting.userName
  );

  expect(response.question.voters).not.toContain(testUserUpvoting._id);

  expect(
    response.question.voters.filter((userId) => userId === testUserUpvoting._id)
      .length
  ).toEqual(0);

  await Question.remove(response.question);
  await User.remove(testUserUpvoting);
});

test("upvote question with new user not in database", async () => {
  const newQuestion = new Question({
    qnaSessionId: testQnASession._id,
    userId: testUser._id,
    content: "This is a question to test upvotes?",
    isAnswered: false,
    voters: [],
  });

  await newQuestion.save();

  const response = await questionDataService.updateUpvote(
    newQuestion._id,
    "134679",
    "New User Junior"
  );

  expect(response.question.voters).toContain("134679");

  await Question.remove(response.question);
  await User.remove(testUserUpvoting);
});

test("ending non-existing qna", async () => {
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

test("ending existing qna with no questions", async () => {
  await qnaSessionDataService.endQnASession(
    testQnASession._id,
    sampleConversationId,
    sampleEndedById,
    sampleEndedByName,
    sampleEndedByUserId
  );

  // get data
  const qnaSessionData: any = await QnASession.findById(testQnASession._id)
    .exec()
    .catch(() => {
      throw new Error("Retrieving QnA Session details");
    });

  expect(qnaSessionData.isActive).toBe(false);
  expect(qnaSessionData.dateTimeEnded).not.toBe(null);
});

test("ending existing qna with a few questions", async () => {
  for (let i = 0; i < 5; i++) {
    const randomString = Math.random().toString(36);
    await questionDataService.createQuestion(
      testQnASession._id,
      randomString,
      sampleUserName4,
      sampleQuestionContent,
      sampleConversationId
    );
  }

  await qnaSessionDataService.endQnASession(
    testQnASession._id,
    sampleConversationId,
    sampleEndedById,
    sampleEndedByName,
    sampleEndedByUserId
  );

  // get data
  const qnaSessionData: any = await QnASession.findById(testQnASession._id)
    .exec()
    .catch(() => {
      throw new Error("Retrieving QnA Session details");
    });

  expect(qnaSessionData.isActive).toBe(false);
  expect(qnaSessionData.dateTimeEnded).not.toBe(null);
});

test("ending qna from different conversation", async () => {
  const randomConversationId = "random";
  await qnaSessionDataService
    .endQnASession(
      testQnASession._id,
      randomConversationId,
      sampleEndedById,
      sampleEndedByName,
      sampleEndedByUserId
    )
    .catch((error) => {
      expect(error).toEqual(
        new Error(
          `session ${testQnASession._id} does not belong to conversation ${randomConversationId}`
        )
      );
    });
});

test("checking if current host is the host", async () => {
  const data = await qnaSessionDataService.isHost(
    testQnASession._id,
    testQnASession.hostId
  );
  expect(data).toEqual(true);
});

test("checking if random attendee is the host", async () => {
  const data = await qnaSessionDataService.isHost(
    testQnASession._id,
    sampleUserAADObjId3
  );
  expect(data).toEqual(false);
});

test("checking if active QnA is currently active", async () => {
  const data = await qnaSessionDataService.isActiveQnA(testQnASession._id);
  expect(data).toEqual(true);
});

test("checking if inactive QnA is currently active", async () => {
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

  await QnASession.remove({ _id: result._id });
});

test("get all ama sessions", async () => {
  const qnaSessions = await qnaSessionDataService.getAllQnASessionData(
    sampleConversationId
  );
  expect(qnaSessions.length).toEqual(1);
  const qnaSession = qnaSessions[0];
  expect(qnaSession.conversationId).toEqual(sampleConversationId);
  expect(qnaSession._id).toEqual(testQnASession._id);
  expect(qnaSession.hostId).toEqual(testQnASession.hostId);
});

test("get all ama sessions with invalid conversation Id", async () => {
  const qnaSessions = await qnaSessionDataService.getAllQnASessionData("1");
  expect(qnaSessions.length).toEqual(0);
});

test("get all ama sessions", async () => {
  const dummyQnASession = await createDummyQnASession();

  const qnaSessions = await qnaSessionDataService.getAllQnASessionData(
    sampleConversationId
  );
  expect(qnaSessions.length).toEqual(2);
  expect(qnaSessions[0].conversationId).toEqual(sampleConversationId);
  expect(qnaSessions[1].conversationId).toEqual(sampleConversationId);
  expect(qnaSessions[0]._id).toEqual(testQnASession._id);
  expect(qnaSessions[1]._id).toEqual(dummyQnASession._id);
  expect(qnaSessions[0].hostId).toEqual(testQnASession.hostId);
  expect(qnaSessions[1].hostId).toEqual(dummyQnASession.hostId);

  await QnASession.remove({ _id: dummyQnASession._id });
});
