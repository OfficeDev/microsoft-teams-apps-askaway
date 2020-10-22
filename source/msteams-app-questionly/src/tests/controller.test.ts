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
} from 'src/controller';
import * as acb from 'src/adaptive-cards/adaptiveCardBuilder';
import { qnaSessionDataService } from 'src/data/services/qnaSessionDataService';
import { questionDataService } from 'src/data/services/questionDataService';

const sampleUserAADObjId1 = 'be36140g-9729-3024-8yg1-147bbi67g2c9';
const sampleUserName = 'Sample Name';
const sampleErrorMessage = 'Sample Error Message';
const sampleQnASessionId = '5f160b862655575054393a0e';
const sampleTitle = 'Weekly QnA Test';
const sampleDescription = 'Weekly QnA Test description';
const sampleActivityId = '1234';
const sampleConversationId = '8293';
const sampleTenantId = '11121';
const sampleScopeId = '12311';
const sampleQuestionContent = 'Sample Question?';
const sampleQuestionId = '2321232';
const sampleHostUserId = '5f160b862655575054393a0e';

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
        sampleQnASessionId,
        sampleUserAADObjId1,
        sampleHostUserId
    );
    expect(acb.getMainCard).toBeCalledTimes(1);
    expect(acb.getMainCard).toBeCalledWith(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleQnASessionId,
        sampleUserAADObjId1,
        sampleHostUserId
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
    (<any>qnaSessionDataService.createQnASession).mockImplementationOnce(
        () => ({
            qnaSessionId: sampleQnASessionId,
            hostId: sampleUserAADObjId1,
        })
    );
    await startQnASession(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleUserAADObjId1,
        sampleActivityId,
        sampleConversationId,
        sampleTenantId,
        sampleScopeId,
        sampleHostUserId,
        true
    );
    expect(qnaSessionDataService.createQnASession).toBeCalledTimes(1);
    expect(qnaSessionDataService.createQnASession).toBeCalledWith(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleUserAADObjId1,
        sampleActivityId,
        sampleConversationId,
        sampleTenantId,
        sampleScopeId,
        sampleHostUserId,
        true
    );
});

test('start qna session in group chat', async () => {
    (<any>qnaSessionDataService.createQnASession).mockImplementationOnce(
        () => ({
            qnaSessionId: sampleQnASessionId,
            hostId: sampleUserAADObjId1,
        })
    );
    await startQnASession(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleUserAADObjId1,
        sampleActivityId,
        sampleConversationId,
        sampleTenantId,
        sampleScopeId,
        sampleHostUserId,
        false
    );
    expect(qnaSessionDataService.createQnASession).toBeCalledTimes(1);
    expect(qnaSessionDataService.createQnASession).toBeCalledWith(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleUserAADObjId1,
        sampleActivityId,
        sampleConversationId,
        sampleTenantId,
        sampleScopeId,
        sampleHostUserId,
        false
    );
});

test('generate leaderboard', async () => {
    await generateLeaderboard(
        sampleQnASessionId,
        sampleUserAADObjId1,
        'default'
    );
    expect(questionDataService.getQuestionData).toBeCalledTimes(1);
    expect(questionDataService.getQuestionData).toBeCalledWith(
        sampleQnASessionId
    );
    expect(qnaSessionDataService.isHost).toBeCalledTimes(1);
    expect(qnaSessionDataService.isHost).toBeCalledWith(
        sampleQnASessionId,
        sampleUserAADObjId1
    );
    expect(qnaSessionDataService.isActiveQnA).toBeCalledTimes(1);
    expect(qnaSessionDataService.isActiveQnA).toBeCalledWith(
        sampleQnASessionId
    );
    expect(acb.generateLeaderboard).toBeCalledTimes(1);
});

test('set activity id', async () => {
    await setActivityId(sampleQnASessionId, sampleActivityId);
    expect(qnaSessionDataService.updateActivityId).toBeCalledTimes(1);
    expect(qnaSessionDataService.updateActivityId).toBeCalledWith(
        sampleQnASessionId,
        sampleActivityId
    );
});

test('get new question card', async () => {
    await getNewQuestionCard(sampleQnASessionId);
    expect(acb.getNewQuestionCard).toBeCalledTimes(1);
    expect(acb.getNewQuestionCard).toBeCalledWith(sampleQnASessionId);
});

test('submit new question', async () => {
    await submitNewQuestion(
        sampleQnASessionId,
        sampleUserAADObjId1,
        sampleUserName,
        sampleQuestionContent
    );
    expect(questionDataService.createQuestion).toBeCalledTimes(1);
    expect(questionDataService.createQuestion).toBeCalledWith(
        sampleQnASessionId,
        sampleUserAADObjId1,
        sampleUserName,
        sampleQuestionContent
    );
});

test('get updated main card', async () => {
    (<any>qnaSessionDataService.getQnASessionData).mockImplementationOnce(
        () => ({
            // arbitrary
            title: [],
            description: [],
            userName: 1,
            userAADObject: null,
        })
    );
    (<any>questionDataService.getQuestions).mockImplementationOnce(() => ({
        // arbitrary
        topQuestions: [],
        recentQuestions: [],
        numQuestions: 1,
    }));
    await getUpdatedMainCard(sampleQnASessionId, false);
    expect(qnaSessionDataService.getQnASessionData).toBeCalledTimes(1);
    expect(qnaSessionDataService.getQnASessionData).toBeCalledWith(
        sampleQnASessionId
    );
    expect(questionDataService.getQuestions).toBeCalledTimes(1);
    expect(questionDataService.getQuestions).toBeCalledWith(
        sampleQnASessionId,
        3
    );
});

test('add upvote', async () => {
    (<any>questionDataService.updateUpvote).mockImplementationOnce(() => ({
        qnaSessionId: sampleQnASessionId,
    }));
    await updateUpvote(
        sampleQuestionId,
        sampleUserAADObjId1,
        sampleUserName,
        'default'
    );
    expect(questionDataService.updateUpvote).toBeCalledTimes(1);
    expect(questionDataService.updateUpvote).toBeCalledWith(
        sampleQuestionId,
        sampleUserAADObjId1,
        sampleUserName
    );
});

test('get end qna confirmation card', async () => {
    await acb.getEndQnAConfirmationCard(sampleQnASessionId);
    expect(acb.getEndQnAConfirmationCard).toBeCalledTimes(1);
    expect(acb.getEndQnAConfirmationCard).toBeCalledWith(sampleQnASessionId);
});

test('end ama session', async () => {
    await endQnASession(sampleQnASessionId, sampleUserAADObjId1);
    expect(qnaSessionDataService.isActiveQnA).toBeCalledTimes(1);
    expect(qnaSessionDataService.isActiveQnA).toBeCalledWith(
        sampleQnASessionId
    );
    expect(qnaSessionDataService.isHost).toBeCalledTimes(1);
    expect(qnaSessionDataService.isHost).toBeCalledWith(
        sampleQnASessionId,
        sampleUserAADObjId1
    );
});

test('get resubmit question card', async () => {
    getResubmitQuestionCard(sampleQnASessionId, sampleQuestionContent);
    expect(acb.getResubmitQuestionErrorCard).toBeCalledTimes(1);
    expect(acb.getResubmitQuestionErrorCard).toBeCalledWith(
        sampleQnASessionId,
        sampleQuestionContent
    );
});

test('is host', async () => {
    isHost(sampleQnASessionId, sampleUserAADObjId1);
    expect(qnaSessionDataService.isHost).toBeCalledTimes(1);
    expect(qnaSessionDataService.isHost).toBeCalledWith(
        sampleQnASessionId,
        sampleUserAADObjId1
    );
});

test('validate conversation id', async () => {
    (<any>qnaSessionDataService.getQnASessionData).mockImplementationOnce(
        () => ({
            // arbitrary
            conversationId: 'string',
        })
    );
    validateConversationId(sampleQnASessionId, sampleConversationId);
    expect(qnaSessionDataService.getQnASessionData).toBeCalledTimes(1);
    expect(qnaSessionDataService.getQnASessionData).toBeCalledWith(
        sampleQnASessionId
    );
});

test('is active qna', async () => {
    await isActiveQnA(sampleQnASessionId);
    expect(qnaSessionDataService.isActiveQnA).toBeCalledTimes(1);
    expect(qnaSessionDataService.isActiveQnA).toBeCalledWith(
        sampleQnASessionId
    );
});
