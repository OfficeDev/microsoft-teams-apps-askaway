import { IQuestion, Question } from "src/schemas/question";
import mongoose from "mongoose";
import { IQnASession, QnASession } from "src/schemas/qnaSession";
import { questionDataService } from "src/services/questionDataService";
import { User } from "src/schemas/user";
import { userDataService } from "src/services/userDataService";

const testConversationId = "testConversationId";
const testQuestionId = "5faccb06e62b5d7ea8e9c49e";
const testUserId = "testUserId";
const testUserName = "testUserName";
let testSession: IQnASession;
let testQuestion: IQuestion;

const createDummyQnASession = async (isactive?: Boolean) => {
  return await new QnASession({
    title: "sampleTitle",
    description: "sampleDescription",
    isActive: isactive !== undefined ? isactive : true,
    hostId: testUserId,
    activityId: "sampleActivityId",
    conversationId: testConversationId,
    tenantId: "sampleTenantId",
    hostUserId: testUserId,
    scope: {
      scopeId: "sampleScopeId",
      isChannel: true,
    },
  }).save();
};

const createDummyQuestion = async (
  qnaSessionId: string,
  isanswered?: Boolean
) => {
  await userDataService.getUserOrCreate(testUserId, testUserName);

  return await new Question({
    qnaSessionId: qnaSessionId,
    userId: testUserId,
    content: "This is a question to test upvotes?",
    isAnswered: isanswered !== undefined ? isanswered : false,
    voters: [],
  }).save();
};

beforeAll(async () => {
  await mongoose.connect(<string>process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });
});

afterEach(async () => {
  QnASession.deleteOne({ _id: testSession.id });

  if (testQuestion) {
    Question.deleteOne({ _id: testQuestion.id });
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

test("upvote question - invalid session id", async () => {
  testSession = await createDummyQnASession();

  const randomSessionId = "5faccb17e62b5d7ea8e9c4a0";
  await expect(
    questionDataService.upVoteQuestion(
      testConversationId,
      randomSessionId,
      testQuestionId,
      testUserId,
      testUserName
    )
  ).rejects.toThrow(`Invalid session id ${randomSessionId}`);
});

test("upvote question - invalid conversation id", async () => {
  const randomConversationId = "randomConversationId";
  testSession = await createDummyQnASession();

  await expect(
    questionDataService.upVoteQuestion(
      randomConversationId,
      testSession.id,
      testQuestionId,
      testUserId,
      testUserName
    )
  ).rejects.toThrow(
    `session ${testSession.id} does not belong to conversation ${randomConversationId}`
  );
});

test("upvote question - session is not active", async () => {
  testSession = await createDummyQnASession(false);

  await expect(
    questionDataService.upVoteQuestion(
      testConversationId,
      testSession.id,
      testQuestionId,
      testUserId,
      testUserName
    )
  ).rejects.toThrow(`session ${testSession.id} is not active`);
});

test("upvote question - invalid question id", async () => {
  testSession = await createDummyQnASession();

  await expect(
    questionDataService.upVoteQuestion(
      testConversationId,
      testSession.id,
      testQuestionId,
      testUserId,
      testUserName
    )
  ).rejects.toThrow(`Invalid question id ${testQuestionId}`);
});

test("upvote question - question from wrong session", async () => {
  testSession = await createDummyQnASession();
  const randomSessionId = "5faccb17e62b5d7ea8e9c4a0";
  testQuestion = await createDummyQuestion(randomSessionId);

  await expect(
    questionDataService.upVoteQuestion(
      testConversationId,
      testSession.id,
      testQuestion.id,
      testUserId,
      testUserName
    )
  ).rejects.toThrow(
    `question ${testQuestion.id} does not belong to session ${testSession.id}`
  );
});

test("upvote question - upvote own question", async () => {
  testSession = await createDummyQnASession();
  testQuestion = await createDummyQuestion(testSession.id);

  await expect(
    questionDataService.upVoteQuestion(
      testConversationId,
      testSession.id,
      testQuestion.id,
      testUserId,
      testUserName
    )
  ).rejects.toThrow("User cannot upvote/ downvote own question");
});

test("upvote question", async () => {
  testSession = await createDummyQnASession();
  const testuser1Id = "user1";
  const testuser1Name = "user1";
  testQuestion = await createDummyQuestion(testSession.id);

  await questionDataService.upVoteQuestion(
    testConversationId,
    testSession.id,
    testQuestion.id,
    testuser1Id,
    testuser1Name
  );

  const question = <IQuestion>await Question.findById(testQuestion.id);
  expect(question.id).toEqual(testQuestion.id);
  expect(question.voters).toBeDefined();
  expect(question.voters.length).toEqual(1);
  expect(question.voters[0]).toEqual(testuser1Id);
});

test("upvote already upvoted question", async () => {
  testSession = await createDummyQnASession();
  const testuser1Id = "user1";
  const testuser1Name = "user1";
  testQuestion = await createDummyQuestion(testSession.id);

  expect(testQuestion.voters.length).toEqual(0);

  await Question.findByIdAndUpdate(
    testQuestion.id,
    { $set: { voters: [testuser1Id] } },
    { upsert: true }
  );

  testQuestion = <IQuestion>await Question.findById(testQuestion.id);
  expect(testQuestion.voters.length).toEqual(1);

  await questionDataService.upVoteQuestion(
    testConversationId,
    testSession.id,
    testQuestion.id,
    testuser1Id,
    testuser1Name
  );

  const question = <IQuestion>await Question.findById(testQuestion.id);
  expect(question.id).toEqual(testQuestion.id);
  expect(question.voters).toBeDefined();
  expect(question.voters.length).toEqual(1);
  expect(question.voters[0]).toEqual(testuser1Id);
});

test("downvote question - invalid session id", async () => {
  testSession = await createDummyQnASession();

  const randomSessionId = "5faccb17e62b5d7ea8e9c4a0";
  await expect(
    questionDataService.downVoteQuestion(
      testConversationId,
      randomSessionId,
      testQuestionId,
      testUserId
    )
  ).rejects.toThrow(`Invalid session id ${randomSessionId}`);
});

test("downvote question - invalid conversation id", async () => {
  const randomConversationId = "randomConversationId";
  testSession = await createDummyQnASession();

  await expect(
    questionDataService.downVoteQuestion(
      randomConversationId,
      testSession.id,
      testQuestionId,
      testUserId
    )
  ).rejects.toThrow(
    `session ${testSession.id} does not belong to conversation ${randomConversationId}`
  );
});

test("downvote question - session is not active", async () => {
  testSession = await createDummyQnASession(false);

  await expect(
    questionDataService.downVoteQuestion(
      testConversationId,
      testSession.id,
      testQuestionId,
      testUserId
    )
  ).rejects.toThrow(`session ${testSession.id} is not active`);
});

test("downvote question - invalid question id", async () => {
  testSession = await createDummyQnASession();

  await expect(
    questionDataService.downVoteQuestion(
      testConversationId,
      testSession.id,
      testQuestionId,
      testUserId
    )
  ).rejects.toThrow(`Invalid question id ${testQuestionId}`);
});

test("downvote question - question from wrong session", async () => {
  testSession = await createDummyQnASession();
  const randomSessionId = "5faccb17e62b5d7ea8e9c4a0";
  testQuestion = await createDummyQuestion(randomSessionId);

  await expect(
    questionDataService.downVoteQuestion(
      testConversationId,
      testSession.id,
      testQuestion.id,
      testUserId
    )
  ).rejects.toThrow(
    `question ${testQuestion.id} does not belong to session ${testSession.id}`
  );
});

test("downvote question - downvote own question", async () => {
  testSession = await createDummyQnASession();
  testQuestion = await createDummyQuestion(testSession.id);

  await expect(
    questionDataService.downVoteQuestion(
      testConversationId,
      testSession.id,
      testQuestion.id,
      testUserId
    )
  ).rejects.toThrow("User cannot upvote/ downvote own question");
});

test("downvote question", async () => {
  testSession = await createDummyQnASession();
  const testuser1Id = "user1";
  testQuestion = await createDummyQuestion(testSession.id);

  testQuestion = await Question.findByIdAndUpdate(
    testQuestion.id,
    { $set: { voters: [testuser1Id] } },
    { upsert: true }
  );

  testQuestion = <IQuestion>await Question.findById(testQuestion.id);
  expect(testQuestion.voters.length).toEqual(1);

  await questionDataService.downVoteQuestion(
    testConversationId,
    testSession.id,
    testQuestion.id,
    testuser1Id
  );

  const question = <IQuestion>await Question.findById(testQuestion.id);
  expect(question.id).toEqual(testQuestion.id);
  expect(question.voters).toBeDefined();
  expect(question.voters.length).toEqual(0);
});

test("downvote not voted question", async () => {
  testSession = await createDummyQnASession();
  const testuser1Id = "user1";
  testQuestion = await createDummyQuestion(testSession.id);

  await questionDataService.downVoteQuestion(
    testConversationId,
    testSession.id,
    testQuestion.id,
    testuser1Id
  );

  const question = <IQuestion>await Question.findById(testQuestion.id);
  expect(question.id).toEqual(testQuestion.id);
  expect(question.voters).toBeDefined();
  expect(question.voters.length).toEqual(0);
});

test("mark question as answered - invalid session id", async () => {
  testSession = await createDummyQnASession();

  const randomSessionId = "5faccb17e62b5d7ea8e9c4a0";
  await expect(
    questionDataService.markQuestionAsAnswered(
      testConversationId,
      randomSessionId,
      testQuestionId
    )
  ).rejects.toThrow(`Invalid session id ${randomSessionId}`);
});

test("mark question as answered - invalid conversation id", async () => {
  const randomConversationId = "randomConversationId";
  testSession = await createDummyQnASession();

  await expect(
    questionDataService.markQuestionAsAnswered(
      randomConversationId,
      testSession.id,
      testQuestionId
    )
  ).rejects.toThrow(
    `session ${testSession.id} does not belong to conversation ${randomConversationId}`
  );
});

test("mark question as answered - session is not active", async () => {
  testSession = await createDummyQnASession(false);

  await expect(
    questionDataService.markQuestionAsAnswered(
      testConversationId,
      testSession.id,
      testQuestionId
    )
  ).rejects.toThrow(`session ${testSession.id} is not active`);
});

test("mark question as answered - invalid question id", async () => {
  testSession = await createDummyQnASession();

  await expect(
    questionDataService.markQuestionAsAnswered(
      testConversationId,
      testSession.id,
      testQuestionId
    )
  ).rejects.toThrow(`Invalid question id ${testQuestionId}`);
});

test("mark question as answered - question from wrong session", async () => {
  testSession = await createDummyQnASession();
  const randomSessionId = "5faccb17e62b5d7ea8e9c4a0";
  testQuestion = await createDummyQuestion(randomSessionId);

  await expect(
    questionDataService.markQuestionAsAnswered(
      testConversationId,
      testSession.id,
      testQuestion.id
    )
  ).rejects.toThrow(
    `question ${testQuestion.id} does not belong to session ${testSession.id}`
  );
});

test("mark question as answered", async () => {
  testSession = await createDummyQnASession();
  testQuestion = await createDummyQuestion(testSession.id);

  expect(testQuestion.isAnswered).not.toBeTruthy();

  await questionDataService.markQuestionAsAnswered(
    testConversationId,
    testSession.id,
    testQuestion.id
  );

  const question = <IQuestion>await Question.findById(testQuestion.id);
  expect(question.id).toEqual(testQuestion.id);
  expect(question.isAnswered).toBeTruthy();
});

test("mark question as answered - already answered question", async () => {
  testSession = await createDummyQnASession();
  testQuestion = await createDummyQuestion(testSession.id, true);
  expect(testQuestion.isAnswered).toBeTruthy();

  await questionDataService.markQuestionAsAnswered(
    testConversationId,
    testSession.id,
    testQuestion.id
  );

  const question = <IQuestion>await Question.findById(testQuestion.id);
  expect(question.id).toEqual(testQuestion.id);
  expect(question.isAnswered).toBeTruthy();
});

test("create question for not active session", async () => {
  testSession = await createDummyQnASession(false);
  await expect(
    questionDataService.createQuestion(
      testSession.id,
      testUserId,
      testUserName,
      "dummy",
      testConversationId
    )
  ).rejects.toThrow(`QnA Session is not active`);
});
