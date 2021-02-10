import { IQuestion, Question } from "src/schemas/question";
import mongoose from "mongoose";
import { IQnASession, QnASession } from "src/schemas/qnaSession";
import { DocumentNotAvailableForOperationError } from "src/errors/documentNotAvailableForOperationError";
import {
  QuestionDataService,
  IQuestionDataService,
} from "src/services/questionDataService";
import {
  IUserDataService,
  UserDataService,
} from "src/services/userDataService";
import {
  IQnASessionDataService,
  QnASessionDataService,
} from "src/services/qnaSessionDataService";
import { IUser, User } from "src/schemas/user";

const testConversationId = "testConversationId";
const testQuestionId = "5faccb06e62b5d7ea8e9c49e";
const testUserId = "testUserId";
const testUserName = "testUserName";
const testUserId1 = "testUserId1";
const testUserName1 = "testUserName1";
const testQuestionContent = "Sample Question?";
const randomSessionId = "5f160b862655575054393a0e";
let testSession: IQnASession;
let testQuestion: IQuestion;
let userDataService: IUserDataService;
let questionDataService: IQuestionDataService;
let testUserUpvoting: IUser;
let qnaSessionDataService: IQnASessionDataService;

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

  userDataService = new UserDataService();
  qnaSessionDataService = new QnASessionDataService(userDataService);
  questionDataService = new QuestionDataService(
    userDataService,
    qnaSessionDataService
  );

  testUserUpvoting = await new User({
    _id: "sampleUserAADObjId3",
    userName: "sampleUserName3",
  }).save();
});

afterEach(async () => {
  await QnASession.deleteOne({ _id: testSession.id });
  await Question.deleteMany({ qnaSessionId: testSession._id });
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
  ).rejects.toThrow("QnA Session record not found");
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
  ).rejects.toThrow("QnA session is no longer active.");
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
  ).rejects.toThrow("QnA Session record not found");
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
  ).rejects.toThrow("QnA session is no longer active.");
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
  ).rejects.toThrow("QnA Session record not found");
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
  ).rejects.toThrow("QnA session is no longer active.");
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
  expect(question.dateTimeMarkAsAnsweredOperationLockAcquired).toBeDefined();
});

test("mark question as unanswered", async () => {
  testSession = await createDummyQnASession();
  testQuestion = await createDummyQuestion(testSession.id, true);

  expect(testQuestion.isAnswered).toBeTruthy();

  await questionDataService.markQuestionAsUnanswered(testQuestion.id);

  const question = <IQuestion>await Question.findById(testQuestion.id);
  expect(question.id).toEqual(testQuestion.id);
  expect(question.isAnswered).not.toBeTruthy();
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
  ).rejects.toThrow("QnA session is no longer active.");
});

test("delete question", async () => {
  testSession = await createDummyQnASession();
  testQuestion = await createDummyQuestion(testSession.id);

  questionDataService.deleteQuestion(testQuestion.id);

  const question = <IQuestion>await Question.findById(testQuestion.id);
  expect(question).toBeNull();
});

test("2nd immediate mark as answered operation should fail due to loack acquired by the first process", async () => {
  testSession = await createDummyQnASession();
  testQuestion = await createDummyQuestion(testSession.id, false);

  process.env.MarkQuestionAsAnsweredOperationLockValidityInMS = "500000";

  await questionDataService.markQuestionAsAnswered(
    testConversationId,
    testSession.id,
    testQuestion.id
  );

  try {
    await questionDataService.markQuestionAsAnswered(
      testConversationId,
      testSession.id,
      testQuestion.id
    );
  } catch (error) {
    expect(error instanceof DocumentNotAvailableForOperationError).toBeTruthy();
  }
});

test("retrieve most recent/top questions with three questions", async () => {
  testSession = await createDummyQnASession();
  const doc: any = await QnASession.findById(testSession._id);
  expect(doc).not.toBeNull();

  // create a new questions
  const questions: any = [
    {
      qnaSessionId: testSession._id,
      userId: testSession._id,
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
      qnaSessionId: testSession._id,
      userId: testSession._id,
      content: "This is test question 2",
      isAnswered: false,
      voters: [],
    },
    {
      qnaSessionId: testSession._id,
      userId: testUserId,
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

  const results = await questionDataService.getQuestionsCountWithRecentAndTopNQuestions(
    testSession._id,
    3
  );
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
});

test("retrieve most top questions with no votes should be most recent questions", async () => {
  testSession = await createDummyQnASession();

  // create a new questions
  const questions: any = [
    {
      qnaSessionId: testSession._id,
      userId: testUserId,
      content: "This is test question 1",
      isAnswered: false,
      voters: [],
    },
    {
      qnaSessionId: testSession._id,
      userId: testUserId,
      content: "This is test question 2",
      isAnswered: false,
      voters: [],
    },
    {
      qnaSessionId: testSession._id,
      userId: testUserId,
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

  const results = await questionDataService.getQuestionsCountWithRecentAndTopNQuestions(
    testSession._id,
    3
  );
  const topQuestions: any = results.topQuestions;
  const numQuestions = results.numQuestions;

  expect(topQuestions).not.toBe(null);
  expect(numQuestions).toEqual(3);

  expect(topQuestions[0]._id).toEqual(questions[2]._id);
  expect(topQuestions[1]._id).toEqual(questions[0]._id);
  expect(topQuestions[2]._id).toEqual(questions[1]._id);
});

test("retrieve most top questions with some votes should be most recent questions", async () => {
  testSession = await createDummyQnASession();

  // create a new questions
  const questions: any = [
    {
      qnaSessionId: testSession._id,
      userId: testUserId,
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
      qnaSessionId: testSession._id,
      userId: testUserId,
      content: "This is test question 2",
      isAnswered: false,
      voters: [],
    },
    {
      qnaSessionId: testSession._id,
      userId: testUserId,
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

  const results = await questionDataService.getQuestionsCountWithRecentAndTopNQuestions(
    testSession._id,
    3
  );
  const topQuestions: any = results.topQuestions;
  const numQuestions = results.numQuestions;

  expect(topQuestions).not.toBe(null);
  expect(numQuestions).toEqual(3);

  expect(topQuestions[0]._id).toEqual(questions[0]._id);
  expect(topQuestions[1]._id).toEqual(questions[2]._id);
  expect(topQuestions[2]._id).toEqual(questions[1]._id);
});

test("retrieve most recent/top questions with no questions", async () => {
  testSession = await createDummyQnASession();

  const results = await questionDataService.getQuestionsCountWithRecentAndTopNQuestions(
    testSession._id,
    3
  );
  const topQuestions: any = results.topQuestions;
  const recentQuestions: any = results.recentQuestions;
  const numQuestions: any = results.numQuestions;

  expect(topQuestions).toEqual([]);
  expect(recentQuestions).toEqual([]);
  expect(numQuestions).toEqual(0);
});

test("retrieve question data in empty QnA", async () => {
  testSession = await createDummyQnASession();
  const questionData = await questionDataService.getAllQuestions(
    testSession._id
  );

  expect(questionData).toEqual([]);
});

test("retrieve question data in non-empty QnA", async () => {
  testSession = await createDummyQnASession();

  const questions: IQuestion[] = [
    new Question({
      qnaSessionId: testSession._id,
      userId: testUserId,
      content: "This is test question 1",
      isAnswered: false,
      voters: [],
    }),
    new Question({
      qnaSessionId: testSession._id,
      userId: testUserId,
      content: "This is test question 2",
      isAnswered: false,
      voters: [],
    }),
  ];

  await questions[0].save();
  await questions[1].save();

  const questionData = await questionDataService.getAllQuestions(
    testSession._id
  );

  expect(questionData[0]._id).toEqual(questions[0]._id);
  expect(questionData[1]._id).toEqual(questions[1]._id);

  await Question.deleteOne({ _id: questionData[0]._id });
  await Question.deleteOne({ _id: questionData[1]._id });
});

test("new question with existing user in existing QnA session", async () => {
  testSession = await createDummyQnASession();

  const question = await questionDataService.createQuestion(
    testSession._id,
    testUserId,
    testUserName,
    testQuestionContent,
    testConversationId
  );

  expect(question).toBeDefined();
  const doc: any = await Question.findById(question.id);
  expect(doc).not.toBeNull();
  expect(doc.id).toEqual(question.id);
  expect(doc.toObject().content).toEqual(testQuestionContent);
});

test("new question with new user in existing QnA session", async () => {
  testSession = await createDummyQnASession();

  const question = await questionDataService.createQuestion(
    testSession._id,
    testUserId1,
    testUserName1,
    testQuestionContent,
    testConversationId
  );
  expect(question.id).toBeDefined();

  const doc: any = await Question.findById(question.id);
  expect(doc).not.toBeNull();
  expect(doc.id).toEqual(question.id);
  expect(doc.toObject().content).toEqual(testQuestionContent);
});

test("new question with existing user in non-existing QnA session", async () => {
  await questionDataService
    .createQuestion(
      randomSessionId,
      testUserId1,
      testUserName,
      testQuestionContent,
      testConversationId
    )
    .catch((error) => {
      expect(error).toEqual(new Error("QnA Session record not found"));
    });
});

test("upvote question that has not been upvoted yet with existing user", async () => {
  testSession = await createDummyQnASession();

  const newQuestion = new Question({
    qnaSessionId: testSession._id,
    userId: testUserId,
    content: "This is a question to test upvotes?",
    isAnswered: false,
    voters: [],
  });

  await newQuestion.save();

  const response = await questionDataService.updateUpvote(
    testConversationId,
    testSession.id,
    newQuestion._id,
    testUserUpvoting._id,
    testUserUpvoting.userName
  );

  expect(response.question.voters).toContain(testUserUpvoting._id);

  await Question.deleteOne(response.question);
  await User.deleteOne(testUserUpvoting);
});

test("upvote question that has already been upvoted with existing user", async () => {
  testSession = await createDummyQnASession();

  const newQuestion = new Question({
    qnaSessionId: testSession.id,
    userId: testUserId,
    content: "This is a question to test upvotes?",
    isAnswered: false,
    voters: [],
  });

  await newQuestion.save();

  let response = await questionDataService.updateUpvote(
    testConversationId,
    testSession.id,
    newQuestion._id,
    testUserUpvoting._id,
    testUserUpvoting.userName
  );

  expect(response.question.voters).toContain(testUserUpvoting._id);

  response = await questionDataService.updateUpvote(
    testConversationId,
    testSession.id,
    newQuestion._id,
    testUserUpvoting._id,
    testUserUpvoting.userName
  );

  expect(response.question.voters).not.toContain(testUserUpvoting._id);

  expect(
    response.question.voters.filter((userId) => userId === testUserUpvoting._id)
      .length
  ).toEqual(0);

  await Question.deleteOne(response.question);
  await User.deleteOne(testUserUpvoting);
});

test("upvote question with new user not in database", async () => {
  testSession = await createDummyQnASession();

  const newQuestion = new Question({
    qnaSessionId: testSession._id,
    userId: testUserId,
    content: "This is a question to test upvotes?",
    isAnswered: false,
    voters: [],
  });

  await newQuestion.save();

  const response = await questionDataService.updateUpvote(
    testConversationId,
    testSession.id,
    newQuestion._id,
    "134679",
    "New User Junior"
  );

  expect(response.question.voters).toContain("134679");

  await Question.deleteOne(response.question);
  await User.deleteOne(testUserUpvoting);
});
