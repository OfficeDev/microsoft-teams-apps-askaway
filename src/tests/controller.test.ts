import {
    getMainCard,
    getStartQnACard,
    startQnASession,
    generateLeaderboard,
    setActivityId,
    getNewQuestionCard,
    submitNewQuestion,
    getUpdatedMainCard,
    updateUpvote,
    getErrorCard,
    endQnASession,
    getResubmitQuestionCard,
    isHost,
    validateConversationId,
    isActiveQnA,
} from 'src/Controller';
import * as acb from 'src/adaptive-cards/adaptiveCardBuilder';
import * as db from 'src/Data/Database';

const sampleUserAADObjId1 = 'be36140g-9729-3024-8yg1-147bbi67g2c9';
const sampleUserName = 'Sample Name';
const sampleErrorMessage = 'Sample Error Message';
const sampleQnASessionID = '5f160b862655575054393a0e';
const sampleTitle = 'Weekly QnA Test';
const sampleDescription = 'Weekly QnA Test description';
const sampleActivityId = '1234';
const sampleConversationId = '8293';
const sampleTenantId = '11121';
const sampleScopeId = '12311';
const sampleQuestionContent = 'Sample Question?';
const sampleQuestionId = '2321232';

jest.mock('../adaptive-cards/adaptiveCardBuilder');
jest.mock('../data/database');

beforeEach(() => {
    process.env.debugMode = 'true';
    jest.clearAllMocks();
});

test('get main card', async () => {
    await getMainCard(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleQnASessionID,
        sampleUserAADObjId1
    );
    expect(acb.getMainCard).toBeCalledTimes(1);
    expect(acb.getMainCard).toBeCalledWith(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleQnASessionID,
        sampleUserAADObjId1
    );
});

test('get start qna card', async () => {
    await getStartQnACard(sampleTitle, sampleDescription, sampleErrorMessage);
    expect(acb.getStartQnACard).toBeCalledTimes(1);
    expect(acb.getStartQnACard).toBeCalledWith(
        sampleTitle,
        sampleDescription,
        sampleErrorMessage
    );
});

test('get error card', async () => {
    getErrorCard(sampleErrorMessage);
    expect(acb.getErrorCard).toBeCalledTimes(1);
    expect(acb.getErrorCard).toBeCalledWith(sampleErrorMessage);
});

test('start qna session in channel', async () => {
    (<any>db.createQnASession).mockImplementationOnce(() => ({
        qnaSessionId: sampleQnASessionID,
        hostId: sampleUserAADObjId1,
    }));
    await startQnASession(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleUserAADObjId1,
        sampleActivityId,
        sampleConversationId,
        sampleTenantId,
        sampleScopeId,
        true
    );
    expect(db.createQnASession).toBeCalledTimes(1);
    expect(db.createQnASession).toBeCalledWith(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleUserAADObjId1,
        sampleActivityId,
        sampleConversationId,
        sampleTenantId,
        sampleScopeId,
        true
    );
});

test('start qna session in group chat', async () => {
    (<any>db.createQnASession).mockImplementationOnce(() => ({
        qnaSessionId: sampleQnASessionID,
        hostId: sampleUserAADObjId1,
    }));
    await startQnASession(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleUserAADObjId1,
        sampleActivityId,
        sampleConversationId,
        sampleTenantId,
        sampleScopeId,
        false
    );
    expect(db.createQnASession).toBeCalledTimes(1);
    expect(db.createQnASession).toBeCalledWith(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleUserAADObjId1,
        sampleActivityId,
        sampleConversationId,
        sampleTenantId,
        sampleScopeId,
        false
    );
});

test('generate leaderboard', async () => {
    await generateLeaderboard(
        sampleQnASessionID,
        sampleUserAADObjId1,
        'default'
    );
    expect(db.getQuestionData).toBeCalledTimes(1);
    expect(db.getQuestionData).toBeCalledWith(sampleQnASessionID);
    expect(db.isHost).toBeCalledTimes(1);
    expect(db.isHost).toBeCalledWith(sampleQnASessionID, sampleUserAADObjId1);
    expect(db.isActiveQnA).toBeCalledTimes(1);
    expect(db.isActiveQnA).toBeCalledWith(sampleQnASessionID);
    expect(acb.generateLeaderboard).toBeCalledTimes(1);
});

test('set activity id', async () => {
    await setActivityId(sampleQnASessionID, sampleActivityId);
    expect(db.updateActivityId).toBeCalledTimes(1);
    expect(db.updateActivityId).toBeCalledWith(
        sampleQnASessionID,
        sampleActivityId
    );
});

test('get new question card', async () => {
    await getNewQuestionCard(sampleQnASessionID);
    expect(acb.getNewQuestionCard).toBeCalledTimes(1);
    expect(acb.getNewQuestionCard).toBeCalledWith(sampleQnASessionID);
});

test('submit new question', async () => {
    await submitNewQuestion(
        sampleQnASessionID,
        sampleUserAADObjId1,
        sampleUserName,
        sampleQuestionContent
    );
    expect(db.createQuestion).toBeCalledTimes(1);
    expect(db.createQuestion).toBeCalledWith(
        sampleQnASessionID,
        sampleUserAADObjId1,
        sampleUserName,
        sampleQuestionContent
    );
});

test('get updated main card', async () => {
    (<any>db.getQnASessionData).mockImplementationOnce(() => ({
        // arbitrary
        title: [],
        description: [],
        userName: 1,
        userAADObject: null,
    }));
    (<any>db.getQuestions).mockImplementationOnce(() => ({
        // arbitrary
        topQuestions: [],
        recentQuestions: [],
        numQuestions: 1,
    }));
    await getUpdatedMainCard(sampleQnASessionID, false);
    expect(db.getQnASessionData).toBeCalledTimes(1);
    expect(db.getQnASessionData).toBeCalledWith(sampleQnASessionID);
    expect(db.getQuestions).toBeCalledTimes(1);
    expect(db.getQuestions).toBeCalledWith(sampleQnASessionID, 3, 3);
});

test('add upvote', async () => {
    (<any>db.updateUpvote).mockImplementationOnce(() => ({
        qnaSessionId: sampleQnASessionID,
    }));
    await updateUpvote(
        sampleQuestionId,
        sampleUserAADObjId1,
        sampleUserName,
        'default'
    );
    expect(db.updateUpvote).toBeCalledTimes(1);
    expect(db.updateUpvote).toBeCalledWith(
        sampleQuestionId,
        sampleUserAADObjId1,
        sampleUserName
    );
});

test('get end qna confirmation card', async () => {
    await acb.getEndQnAConfirmationCard(sampleQnASessionID);
    expect(acb.getEndQnAConfirmationCard).toBeCalledTimes(1);
    expect(acb.getEndQnAConfirmationCard).toBeCalledWith(sampleQnASessionID);
});

test('end ama session', async () => {
    await endQnASession(sampleQnASessionID, sampleUserAADObjId1);
    expect(db.isActiveQnA).toBeCalledTimes(1);
    expect(db.isActiveQnA).toBeCalledWith(sampleQnASessionID);
    expect(db.isHost).toBeCalledTimes(1);
    expect(db.isHost).toBeCalledWith(sampleQnASessionID, sampleUserAADObjId1);
});

test('get resubmit question card', async () => {
    getResubmitQuestionCard(sampleQnASessionID, sampleQuestionContent);
    expect(acb.getResubmitQuestionErrorCard).toBeCalledTimes(1);
    expect(acb.getResubmitQuestionErrorCard).toBeCalledWith(
        sampleQnASessionID,
        sampleQuestionContent
    );
});

test('is host', async () => {
    isHost(sampleQnASessionID, sampleUserAADObjId1);
    expect(db.isHost).toBeCalledTimes(1);
    expect(db.isHost).toBeCalledWith(sampleQnASessionID, sampleUserAADObjId1);
});

test('validate conversation id', async () => {
    (<any>db.getQnASessionData).mockImplementationOnce(() => ({
        // arbitrary
        conversationId: 'string',
    }));
    validateConversationId(sampleQnASessionID, sampleConversationId);
    expect(db.getQnASessionData).toBeCalledTimes(1);
    expect(db.getQnASessionData).toBeCalledWith(sampleQnASessionID);
});

test('is active qna', async () => {
    await isActiveQnA(sampleQnASessionID);
    expect(db.isActiveQnA).toBeCalledTimes(1);
    expect(db.isActiveQnA).toBeCalledWith(sampleQnASessionID);
});
