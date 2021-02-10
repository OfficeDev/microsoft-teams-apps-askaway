import { Controller, IController } from 'src/controller';
import * as acb from 'src/adaptive-cards/adaptiveCardBuilder';
import * as maincardBuilder from 'msteams-app-questionly.common';
import { IQnASessionDataService, QnASessionDataService, QuestionDataService, IQuestionDataService, IConversation, UserDataService } from 'msteams-app-questionly.data';
import { isPresenterOrOrganizer } from 'src/util/meetingsUtility';
import {
    triggerBackgroundJobForQuestionPostedEvent,
    triggerBackgroundJobForQnaSessionCreatedEvent,
    triggerBackgroundJobForQuestionDownvotedEvent,
    triggerBackgroundJobForQuestionMarkedAsAnsweredEvent,
    triggerBackgroundJobForQnaSessionEndedEvent,
    triggerBackgroundJobForQuestionUpvotedEvent,
} from 'src/background-job/backgroundJobTrigger';

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
const sampleServiceUrl = 'sampleServiceUrl';
const sampleMeetingId = 'meetingId';

jest.mock('../adaptive-cards/adaptiveCardBuilder');
jest.mock('msteams-app-questionly.data');
jest.mock('msteams-app-questionly.common');

const getMainCard = maincardBuilder.getMainCard;
const getStartQnACard = acb.getStartQnACard;
const getErrorCard = acb.getErrorCard;

let controller: IController;
let questionDataService: IQuestionDataService;
let qnaSessionDataService: IQnASessionDataService;

beforeAll(() => {
    const userDataService = new UserDataService();
    qnaSessionDataService = new QnASessionDataService(userDataService);
    questionDataService = new QuestionDataService(userDataService, qnaSessionDataService);
    controller = new Controller(questionDataService, qnaSessionDataService);
});

beforeEach(() => {
    process.env.debugMode = 'true';
    jest.clearAllMocks();
});

test('get main card', async () => {
    await getMainCard(sampleTitle, sampleDescription, sampleUserName, sampleQnASessionId, sampleUserAADObjId1, sampleHostUserId);
    expect(maincardBuilder.getMainCard).toBeCalledTimes(1);
    expect(maincardBuilder.getMainCard).toBeCalledWith(sampleTitle, sampleDescription, sampleUserName, sampleQnASessionId, sampleUserAADObjId1, sampleHostUserId);
});

test('get start qna card', async () => {
    await getStartQnACard(sampleTitle, sampleDescription, sampleErrorMessage);
    expect(acb.getStartQnACard).toBeCalledTimes(1);
    expect(acb.getStartQnACard).toBeCalledWith(sampleTitle, sampleDescription, sampleErrorMessage);
});

test('get error card', async () => {
    getErrorCard(sampleErrorMessage);
    expect(acb.getErrorCard).toBeCalledTimes(1);
    expect(acb.getErrorCard).toBeCalledWith(sampleErrorMessage);
});

test('start qna session in channel', async () => {
    (<any>qnaSessionDataService.createQnASession).mockImplementationOnce(() => ({
        qnaSessionId: sampleQnASessionId,
        hostId: sampleUserAADObjId1,
    }));

    (<any>triggerBackgroundJobForQnaSessionCreatedEvent) = jest.fn(() => {
        return Promise.resolve(true);
    });

    await controller.startQnASession({
        title: sampleTitle,
        description: sampleDescription,
        userName: sampleUserName,
        userAadObjectId: sampleUserAADObjId1,
        activityId: sampleActivityId,
        conversationId: sampleConversationId,
        tenantId: sampleTenantId,
        scopeId: sampleScopeId,
        hostUserId: sampleHostUserId,
        isChannel: true,
        serviceUrl: sampleServiceUrl,
    });
    expect(qnaSessionDataService.createQnASession).toBeCalledTimes(1);
    expect(qnaSessionDataService.createQnASession).toBeCalledWith({
        title: sampleTitle,
        description: sampleDescription,
        userName: sampleUserName,
        userAadObjectId: sampleUserAADObjId1,
        activityId: sampleActivityId,
        conversationId: sampleConversationId,
        tenantId: sampleTenantId,
        scopeId: sampleScopeId,
        hostUserId: sampleHostUserId,
        isChannel: true,
        isMeetingGroupChat: false,
    });
    // Make sure background job is triggered.
    expect(<any>triggerBackgroundJobForQnaSessionCreatedEvent).toBeCalledTimes(1);
});

test('start qna session in group chat', async () => {
    (<any>isPresenterOrOrganizer) = jest.fn();
    (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
        return true;
    });
    (<any>qnaSessionDataService.createQnASession).mockImplementationOnce(() => ({
        qnaSessionId: sampleQnASessionId,
        hostId: sampleUserAADObjId1,
    }));

    (<any>triggerBackgroundJobForQnaSessionCreatedEvent) = jest.fn(() => {
        return Promise.resolve(true);
    });

    await controller.startQnASession({
        title: sampleTitle,
        description: sampleDescription,
        userName: sampleUserName,
        userAadObjectId: sampleUserAADObjId1,
        activityId: sampleActivityId,
        conversationId: sampleConversationId,
        tenantId: sampleTenantId,
        scopeId: sampleScopeId,
        hostUserId: sampleHostUserId,
        isChannel: false,
        serviceUrl: sampleServiceUrl,
        meetingId: sampleMeetingId,
    });
    expect(qnaSessionDataService.createQnASession).toBeCalledTimes(1);
    expect(qnaSessionDataService.createQnASession).toBeCalledWith({
        title: sampleTitle,
        description: sampleDescription,
        userName: sampleUserName,
        userAadObjectId: sampleUserAADObjId1,
        activityId: sampleActivityId,
        conversationId: sampleConversationId,
        tenantId: sampleTenantId,
        scopeId: sampleScopeId,
        hostUserId: sampleHostUserId,
        isChannel: false,
        isMeetingGroupChat: true,
    });

    // Make sure background job is triggered.
    expect(<any>triggerBackgroundJobForQnaSessionCreatedEvent).toBeCalledTimes(1);
});

test('create qna session - revert changes if background function is not triggered.', async () => {
    (<any>isPresenterOrOrganizer) = jest.fn();
    (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
        return true;
    });
    (<any>qnaSessionDataService.createQnASession).mockImplementationOnce(() => ({
        qnaSessionId: sampleQnASessionId,
        hostId: sampleUserAADObjId1,
    }));

    (<any>triggerBackgroundJobForQnaSessionCreatedEvent) = jest.fn(() => {
        return Promise.resolve(false);
    });

    await expect(
        controller.startQnASession({
            title: sampleTitle,
            description: sampleDescription,
            userName: sampleUserName,
            userAadObjectId: sampleUserAADObjId1,
            activityId: sampleActivityId,
            conversationId: sampleConversationId,
            tenantId: sampleTenantId,
            scopeId: sampleScopeId,
            hostUserId: sampleHostUserId,
            isChannel: false,
            serviceUrl: sampleServiceUrl,
            meetingId: sampleMeetingId,
        })
    ).rejects.toThrow();
    expect(qnaSessionDataService.createQnASession).toBeCalledTimes(1);

    // Make sure qna session data is deleted.
    expect(qnaSessionDataService.deleteQnASession).toBeCalledTimes(1);

    // Make sure background job is triggered.
    expect(<any>triggerBackgroundJobForQnaSessionCreatedEvent).toBeCalledTimes(1);
});

test('start qna session in meeting for attendee', async () => {
    (<any>isPresenterOrOrganizer) = jest.fn();
    (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
        return false;
    });
    (<any>qnaSessionDataService.createQnASession).mockImplementationOnce(() => ({
        qnaSessionId: sampleQnASessionId,
        hostId: sampleUserAADObjId1,
    }));
    (<any>triggerBackgroundJobForQnaSessionCreatedEvent) = jest.fn(() => {
        return Promise.resolve(true);
    });
    await expect(
        controller.startQnASession({
            title: sampleTitle,
            description: sampleDescription,
            userName: sampleUserName,
            userAadObjectId: sampleUserAADObjId1,
            activityId: sampleActivityId,
            conversationId: sampleConversationId,
            tenantId: sampleTenantId,
            scopeId: sampleScopeId,
            hostUserId: sampleHostUserId,
            isChannel: false,
            serviceUrl: sampleServiceUrl,
            meetingId: sampleMeetingId,
        })
    ).rejects.toThrow();
    expect(qnaSessionDataService.createQnASession).toBeCalledTimes(0);

    // Make sure background job is not triggered.
    expect(<any>triggerBackgroundJobForQnaSessionCreatedEvent).toBeCalledTimes(0);
});

test('generate leaderboard', async () => {
    await controller.generateLeaderboard(sampleQnASessionId, sampleUserAADObjId1, 'default');
    expect(questionDataService.getAllQuestions).toBeCalledTimes(1);
    expect(questionDataService.getAllQuestions).toBeCalledWith(sampleQnASessionId);
    expect(qnaSessionDataService.isHost).toBeCalledTimes(1);
    expect(qnaSessionDataService.isHost).toBeCalledWith(sampleQnASessionId, sampleUserAADObjId1);
    expect(qnaSessionDataService.isActiveQnA).toBeCalledTimes(1);
    expect(qnaSessionDataService.isActiveQnA).toBeCalledWith(sampleQnASessionId);
    expect(acb.generateLeaderboard).toBeCalledTimes(1);
});

test('get new question card', async () => {
    await controller.getNewQuestionCard(sampleQnASessionId);
    expect(acb.getNewQuestionCard).toBeCalledTimes(1);
    expect(acb.getNewQuestionCard).toBeCalledWith(sampleQnASessionId);
});

test('submit new question - revert changes if background function is not triggered.', async () => {
    (<any>triggerBackgroundJobForQuestionPostedEvent) = jest.fn(() => {
        return Promise.resolve(false);
    });

    (<any>questionDataService.createQuestion) = jest.fn(() => {
        return Promise.resolve({ _id: 'random' });
    });

    await expect(
        controller.submitNewQuestion(sampleQnASessionId, sampleUserAADObjId1, sampleUserName, sampleQuestionContent, sampleConversationId, sampleServiceUrl, sampleMeetingId)
    ).rejects.toThrow();
    expect(questionDataService.createQuestion).toBeCalledTimes(1);

    // Make sure background job is triggered.
    expect(<any>triggerBackgroundJobForQuestionPostedEvent).toBeCalledTimes(1);

    // Make sure that the changes are reverted.
    expect(questionDataService.deleteQuestion).toBeCalledTimes(1);
});

test('submit new question - ', async () => {
    (<any>triggerBackgroundJobForQuestionPostedEvent) = jest.fn(() => {
        return Promise.resolve(true);
    });

    await controller.submitNewQuestion(sampleQnASessionId, sampleUserAADObjId1, sampleUserName, sampleQuestionContent, sampleConversationId, sampleServiceUrl, sampleMeetingId);
    expect(questionDataService.createQuestion).toBeCalledTimes(1);
    expect(questionDataService.createQuestion).toBeCalledWith(sampleQnASessionId, sampleUserAADObjId1, sampleUserName, sampleQuestionContent, sampleConversationId);

    // Make sure background job is triggered.
    expect(<any>triggerBackgroundJobForQuestionPostedEvent).toBeCalledTimes(1);
});

test('add upvote', async () => {
    (<any>questionDataService.updateUpvote).mockImplementationOnce(() => {
        return {
            question: {
                id: 'test',
            },
            upvoted: true,
        };
    });

    (<any>triggerBackgroundJobForQuestionUpvotedEvent) = jest.fn(() => {
        return Promise.resolve(true);
    });

    await controller.updateUpvote(sampleQnASessionId, sampleQuestionId, sampleUserAADObjId1, sampleUserName, sampleConversationId, 'default', sampleServiceUrl, sampleMeetingId);
    expect(questionDataService.updateUpvote).toBeCalledTimes(1);

    // Make sure background job is triggered.
    expect(<any>triggerBackgroundJobForQuestionUpvotedEvent).toBeCalledTimes(1);
});

test('add upvote - revert changes if background function is not triggered.', async () => {
    (<any>questionDataService.updateUpvote).mockImplementationOnce(() => {
        return {
            question: {
                id: 'test',
            },
            upvoted: true,
        };
    });

    (<any>triggerBackgroundJobForQuestionUpvotedEvent) = jest.fn(() => {
        return Promise.resolve(false);
    });

    await expect(
        controller.updateUpvote(sampleQnASessionId, sampleQuestionId, sampleUserAADObjId1, sampleUserName, sampleConversationId, 'default', sampleServiceUrl, sampleMeetingId)
    ).rejects.toThrow();

    // Make sure `updateUpvote` is called twice, once for updating vote and once for reverting change.
    expect(questionDataService.updateUpvote).toBeCalledTimes(2);
    // Make sure background job is triggered.
    expect(<any>triggerBackgroundJobForQuestionUpvotedEvent).toBeCalledTimes(1);
});

test('remove upvote', async () => {
    (<any>questionDataService.updateUpvote).mockImplementationOnce(() => {
        return {
            question: {
                id: 'test',
            },
            upvoted: false,
        };
    });

    (<any>triggerBackgroundJobForQuestionDownvotedEvent) = jest.fn(() => {
        return Promise.resolve(true);
    });

    await controller.updateUpvote(sampleQnASessionId, sampleQuestionId, sampleUserAADObjId1, sampleUserName, sampleConversationId, 'default', sampleServiceUrl, sampleMeetingId);
    expect(questionDataService.updateUpvote).toBeCalledTimes(1);

    // Make sure background job is triggered.
    expect(<any>triggerBackgroundJobForQuestionDownvotedEvent).toBeCalledTimes(1);
});

test('remove upvote - revert changes if background function is not triggered.', async () => {
    (<any>questionDataService.updateUpvote).mockImplementationOnce(() => {
        return {
            question: {
                id: 'test',
            },
            upvoted: false,
        };
    });

    (<any>triggerBackgroundJobForQuestionDownvotedEvent) = jest.fn(() => {
        return Promise.resolve(false);
    });

    await expect(
        controller.updateUpvote(sampleQnASessionId, sampleQuestionId, sampleUserAADObjId1, sampleUserName, sampleConversationId, 'default', sampleServiceUrl, sampleMeetingId)
    ).rejects.toThrow();

    // Make sure `updateUpvote` is called twice, once for updating vote and once for reverting change.
    expect(questionDataService.updateUpvote).toBeCalledTimes(2);

    // Make sure background job is triggered.
    expect(<any>triggerBackgroundJobForQuestionDownvotedEvent).toBeCalledTimes(1);
});

test('get end qna confirmation card', async () => {
    await acb.getEndQnAConfirmationCard(sampleQnASessionId);
    expect(acb.getEndQnAConfirmationCard).toBeCalledTimes(1);
    expect(acb.getEndQnAConfirmationCard).toBeCalledWith(sampleQnASessionId);
});

test('end ama session', async () => {
    (<any>triggerBackgroundJobForQnaSessionEndedEvent) = jest.fn(() => {
        return Promise.resolve(true);
    });

    await expect(
        controller.endQnASession({
            qnaSessionId: sampleQnASessionId,
            aadObjectId: sampleUserAADObjId1,
            conversationId: sampleConversationId,
            tenantId: sampleTenantId,
            serviceURL: sampleServiceUrl,
            userName: sampleUserName,
            endedByUserId: sampleHostUserId,
        })
    ).rejects.toThrow();

    // Make sure background job is not triggered.
    expect(<any>triggerBackgroundJobForQnaSessionEndedEvent).toBeCalledTimes(0);
});

test('end ama session - meeting', async () => {
    (<any>isPresenterOrOrganizer) = jest.fn();
    (<any>qnaSessionDataService.isActiveQnA) = jest.fn();
    (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
        return true;
    });

    (<any>triggerBackgroundJobForQnaSessionEndedEvent) = jest.fn(() => {
        return Promise.resolve(true);
    });

    await controller.endQnASession({
        qnaSessionId: sampleQnASessionId,
        aadObjectId: sampleUserAADObjId1,
        conversationId: sampleConversationId,
        tenantId: sampleTenantId,
        serviceURL: sampleServiceUrl,
        meetingId: sampleMeetingId,
        userName: sampleUserName,
        endedByUserId: sampleHostUserId,
    });
    expect(isPresenterOrOrganizer).toBeCalledTimes(1);
    expect(isPresenterOrOrganizer).toBeCalledWith(sampleMeetingId, sampleUserAADObjId1, sampleTenantId, sampleServiceUrl);

    // Make sure background job is triggered.
    expect(<any>triggerBackgroundJobForQnaSessionEndedEvent).toBeCalledTimes(1);
});

test('end ama session - revert changes if background function is not triggered.', async () => {
    (<any>isPresenterOrOrganizer) = jest.fn();
    (<any>qnaSessionDataService.isActiveQnA) = jest.fn();
    (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
        return true;
    });
    (<any>qnaSessionDataService.isActiveQnA).mockImplementationOnce(() => {
        return true;
    });

    (<any>triggerBackgroundJobForQnaSessionEndedEvent) = jest.fn(() => {
        return Promise.resolve(false);
    });

    await expect(
        controller.endQnASession({
            qnaSessionId: sampleQnASessionId,
            aadObjectId: sampleUserAADObjId1,
            conversationId: sampleConversationId,
            tenantId: sampleTenantId,
            serviceURL: sampleServiceUrl,
            meetingId: sampleMeetingId,
            userName: sampleUserName,
            endedByUserId: sampleHostUserId,
        })
    ).rejects.toThrow();

    // Make sure background job is triggered.
    expect(<any>triggerBackgroundJobForQnaSessionEndedEvent).toBeCalledTimes(1);

    // Make sure changes are reverted.
    expect(qnaSessionDataService.activateQnASession).toBeCalledTimes(1);
});

test('end ama session - meeting for attendee', async () => {
    (<any>isPresenterOrOrganizer) = jest.fn();
    (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
        return false;
    });

    (<any>triggerBackgroundJobForQnaSessionEndedEvent) = jest.fn(() => {
        return Promise.resolve(true);
    });

    await expect(
        controller.endQnASession({
            qnaSessionId: sampleQnASessionId,
            aadObjectId: sampleUserAADObjId1,
            conversationId: sampleConversationId,
            tenantId: sampleTenantId,
            serviceURL: sampleServiceUrl,
            meetingId: sampleMeetingId,
            userName: sampleUserName,
            endedByUserId: sampleHostUserId,
        })
    ).rejects.toThrow();

    expect(isPresenterOrOrganizer).toBeCalledTimes(1);
    expect(isPresenterOrOrganizer).toBeCalledWith(sampleMeetingId, sampleUserAADObjId1, sampleTenantId, sampleServiceUrl);

    // Make sure background job is not triggered.
    expect(<any>triggerBackgroundJobForQnaSessionEndedEvent).toBeCalledTimes(0);
});

test('get resubmit question card', async () => {
    controller.getResubmitQuestionCard(sampleQnASessionId, sampleQuestionContent);
    expect(acb.getResubmitQuestionErrorCard).toBeCalledTimes(1);
    expect(acb.getResubmitQuestionErrorCard).toBeCalledWith(sampleQnASessionId, sampleQuestionContent);
});

test('is host', async () => {
    controller.isHost(sampleQnASessionId, sampleUserAADObjId1);
    expect(qnaSessionDataService.isHost).toBeCalledTimes(1);
    expect(qnaSessionDataService.isHost).toBeCalledWith(sampleQnASessionId, sampleUserAADObjId1);
});

test('validate conversation id', async () => {
    (<any>qnaSessionDataService.getQnASessionData).mockImplementationOnce(() => ({
        // arbitrary
        conversationId: 'string',
    }));
    controller.validateConversationId(sampleQnASessionId, sampleConversationId);
    expect(qnaSessionDataService.getQnASessionData).toBeCalledTimes(1);
    expect(qnaSessionDataService.getQnASessionData).toBeCalledWith(sampleQnASessionId);
});

test('is active qna', async () => {
    await controller.isActiveQnA(sampleQnASessionId);
    expect(qnaSessionDataService.isActiveQnA).toBeCalledTimes(1);
    expect(qnaSessionDataService.isActiveQnA).toBeCalledWith(sampleQnASessionId);
});

test('mark question as answered api - user has sufficient permissions', async () => {
    (<any>triggerBackgroundJobForQuestionMarkedAsAnsweredEvent) = jest.fn(() => {
        return Promise.resolve(true);
    });
    (<any>questionDataService.markQuestionAsAnswered) = jest.fn();
    (<any>isPresenterOrOrganizer) = jest.fn();
    (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
        return true;
    });

    await controller.markQuestionAsAnswered(
        // tslint:disable-next-line
        {
            id: sampleConversationId,
            serviceUrl: sampleServiceUrl,
            tenantId: sampleTenantId,
        } as IConversation,
        sampleMeetingId,
        sampleQnASessionId,
        sampleQuestionId,
        sampleUserAADObjId1,
        sampleServiceUrl
    );

    expect(<any>questionDataService.markQuestionAsAnswered).toBeCalledTimes(1);
    // Make sure background job is triggered.
    expect(<any>triggerBackgroundJobForQuestionMarkedAsAnsweredEvent).toBeCalledTimes(1);
});

test('mark question as answered api - revert changes if background function is not triggered.', async () => {
    (<any>triggerBackgroundJobForQuestionMarkedAsAnsweredEvent) = jest.fn(() => {
        return Promise.resolve(false);
    });
    (<any>isPresenterOrOrganizer) = jest.fn();
    (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
        return true;
    });

    await expect(
        controller.markQuestionAsAnswered(
            // tslint:disable-next-line
            {
                id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
            } as IConversation,
            sampleMeetingId,
            sampleQnASessionId,
            sampleQuestionId,
            sampleUserAADObjId1,
            sampleServiceUrl
        )
    ).rejects.toThrow();

    expect(<any>questionDataService.markQuestionAsAnswered).toBeCalledTimes(1);
    // Make sure background job is triggered.
    expect(<any>triggerBackgroundJobForQuestionMarkedAsAnsweredEvent).toBeCalledTimes(1);

    // Make sure that the changes are reverted.
    expect(<any>questionDataService.markQuestionAsUnanswered).toBeCalledTimes(1);
});

test('mark question as answered api - user does not have sufficient permissions', async () => {
    (<any>triggerBackgroundJobForQuestionMarkedAsAnsweredEvent) = jest.fn(() => {
        return Promise.resolve(true);
    });
    (<any>questionDataService.markQuestionAsAnswered) = jest.fn();
    (<any>isPresenterOrOrganizer) = jest.fn();
    (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
        return false;
    });

    await expect(
        controller.markQuestionAsAnswered(
            // tslint:disable-next-line
            {
                id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
            } as IConversation,
            sampleMeetingId,
            sampleQnASessionId,
            sampleQuestionId,
            sampleUserAADObjId1,
            sampleServiceUrl
        )
    ).rejects.toThrow();

    expect(<any>questionDataService.markQuestionAsAnswered).toBeCalledTimes(0);
    // Make sure background job is not triggered.
    expect(<any>triggerBackgroundJobForQuestionMarkedAsAnsweredEvent).toBeCalledTimes(0);
});
