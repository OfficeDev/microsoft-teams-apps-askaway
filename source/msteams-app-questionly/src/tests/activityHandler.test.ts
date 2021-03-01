/* eslint-disable @typescript-eslint/tslint/config */
import { AskAway } from 'src/askAway';
import { TaskModuleRequest } from 'botframework-connector/lib/connectorApi/models';
import { IController, Controller } from 'src/Controller';
import { errorStrings, initLocalization } from 'src/localization/locale';
import { ConversationDataService, IQuestionDataService, IUserDataService, UserDataService, QuestionDataService, IQnASessionDataService, QnASessionDataService } from 'msteams-app-questionly.data';
import { getMeetingIdFromContext } from 'src/util/meetingsUtility';
import * as maincardBuilder from 'msteams-app-questionly.common';
import * as adaptiveCardBuilder from 'src/adaptive-cards/adaptiveCardBuilder';
import { EventInitiator } from 'src/enums/eventInitiator';

jest.mock('msteams-app-questionly.common');
jest.mock('src/adaptive-cards/adaptiveCardBuilder');
let mockController: IController;
let mockUserDataService: IUserDataService;
let mockQuestionDataService: IQuestionDataService;
let mockQnASessionDataService: IQnASessionDataService;

beforeAll(async () => {
    await initLocalization();
    mockUserDataService = new UserDataService();
    mockQnASessionDataService = new QnASessionDataService(mockUserDataService);
    mockQuestionDataService = new QuestionDataService(mockUserDataService, mockQuestionDataService);
    mockController = new Controller(mockQuestionDataService, mockQnASessionDataService);
    (<any>mockController.validateConversationId) = jest.fn();
    (<any>mockController.startQnASession) = jest.fn();
    (<any>mockController.endQnASession) = jest.fn();
    (<any>mockController.submitNewQuestion) = jest.fn();
    (<any>mockController.updateUpvote) = jest.fn();
});

describe('teams task module fetch', () => {
    let handler;
    let context;

    beforeEach(() => {
        handler = <any>new AskAway(new ConversationDataService(), mockController);
        handler.handleTeamsTaskModuleFetchViewLeaderboard = jest.fn();
        handler.handleTeamsTaskModuleFetchAskQuestion = jest.fn();
        handler.handleTeamsTaskModuleFetchError = jest.fn();

        context = {
            activity: {
                conversation: {
                    id: 'randomConvoId',
                },
            },
        };
    });

    it('view leaderboard handler triggered', async () => {
        const taskModuleRequest: TaskModuleRequest = {
            data: {
                id: 'viewLeaderboard',
            },
        };

        await handler.handleTeamsTaskModuleFetch(context, taskModuleRequest);

        expect(handler.handleTeamsTaskModuleFetchViewLeaderboard).toBeCalledTimes(1);

        expect(handler.handleTeamsTaskModuleFetchAskQuestion).toBeCalledTimes(0);
    });

    it('ask question handler triggered', async () => {
        const taskModuleRequest: TaskModuleRequest = {
            data: {
                id: 'askQuestion',
            },
        };

        await handler.handleTeamsTaskModuleFetch(context, taskModuleRequest);

        expect(handler.handleTeamsTaskModuleFetchViewLeaderboard).toBeCalledTimes(0);

        expect(handler.handleTeamsTaskModuleFetchAskQuestion).toBeCalledTimes(1);
    });

    it('returns failed task module fetch', async () => {
        // console.error is supposed to be called
        const taskModuleRequest: TaskModuleRequest = {
            data: {
                id: 'randomInvalidId',
            },
        };

        await handler.handleTeamsTaskModuleFetch(context, taskModuleRequest);

        expect(handler.handleTeamsTaskModuleFetchViewLeaderboard).toBeCalledTimes(0);

        expect(handler.handleTeamsTaskModuleFetchAskQuestion).toBeCalledTimes(0);

        expect(handler.handleTeamsTaskModuleFetchError).toBeCalledTimes(1);
    });
});

// eslint-disable-next-line @typescript-eslint/tslint/config
describe('teams task module submit', () => {
    let handler;
    let context;

    beforeEach(() => {
        handler = <any>new AskAway(new ConversationDataService(), mockController);
        handler.handleTeamsTaskModuleSubmitQuestion = jest.fn();
        handler.handleTeamsTaskModuleSubmitUpvote = jest.fn();
        handler.handleTeamsTaskModuleSubmitConfirmEndQnA = jest.fn();
        handler.handleTeamsTaskModuleSubmitEndQnA = jest.fn();
        handler.handleTeamsTaskModuleSubmitError = jest.fn();
        handler.handleTeamsTaskModuleSubmitRefreshLeaderboard = jest.fn();

        context = {
            activity: {
                from: 'user',
                conversation: {
                    id: 'randomConvoId',
                },
            },
        };
    });

    it('submits question', async () => {
        const taskModuleRequest: TaskModuleRequest = {
            data: {
                id: 'submitQuestion',
            },
        };
        await handler.handleTeamsTaskModuleSubmit(context, taskModuleRequest);

        expect(handler.handleTeamsTaskModuleSubmitQuestion).toBeCalledTimes(1);
        expect(handler.handleTeamsTaskModuleSubmitUpvote).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitRefreshLeaderboard).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitConfirmEndQnA).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitEndQnA).toBeCalledTimes(0);
    });

    it('submits upvotes', async () => {
        const taskModuleRequest: TaskModuleRequest = {
            data: {
                id: 'upvote',
            },
        };
        await handler.handleTeamsTaskModuleSubmit(context, taskModuleRequest);

        expect(handler.handleTeamsTaskModuleSubmitQuestion).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitUpvote).toBeCalledTimes(1);
        expect(handler.handleTeamsTaskModuleSubmitRefreshLeaderboard).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitConfirmEndQnA).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitEndQnA).toBeCalledTimes(0);
    });

    it('refresh leaderboard', async () => {
        const taskModuleRequest: TaskModuleRequest = {
            data: {
                id: 'refreshLeaderboard',
            },
        };
        await handler.handleTeamsTaskModuleSubmit(context, taskModuleRequest);

        expect(handler.handleTeamsTaskModuleSubmitQuestion).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitUpvote).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitRefreshLeaderboard).toBeCalledTimes(1);
        expect(handler.handleTeamsTaskModuleSubmitConfirmEndQnA).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitEndQnA).toBeCalledTimes(0);
    });

    it('submits confirm end qna', async () => {
        const taskModuleRequest: TaskModuleRequest = {
            data: {
                id: 'confirmEndQnA',
            },
        };
        await handler.handleTeamsTaskModuleSubmit(context, taskModuleRequest);

        expect(handler.handleTeamsTaskModuleSubmitQuestion).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitUpvote).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitRefreshLeaderboard).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitConfirmEndQnA).toBeCalledTimes(1);
        expect(handler.handleTeamsTaskModuleSubmitEndQnA).toBeCalledTimes(0);
    });

    it('submits end qna', async () => {
        const taskModuleRequest: TaskModuleRequest = {
            data: {
                id: 'submitEndQnA',
            },
        };
        await handler.handleTeamsTaskModuleSubmit(context, taskModuleRequest);

        expect(handler.handleTeamsTaskModuleSubmitQuestion).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitUpvote).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitRefreshLeaderboard).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitConfirmEndQnA).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitEndQnA).toBeCalledTimes(1);
    });

    it('submits cancel end qna', async () => {
        const taskModuleRequest: TaskModuleRequest = {
            data: {
                id: 'cancelEndQnA',
            },
        };
        await handler.handleTeamsTaskModuleSubmit(context, taskModuleRequest);

        expect(handler.handleTeamsTaskModuleSubmitQuestion).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitUpvote).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitRefreshLeaderboard).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitConfirmEndQnA).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitEndQnA).toBeCalledTimes(1);
    });

    it('return failed task module submit', async () => {
        // console.error is supposed to be called
        const taskModuleRequest: TaskModuleRequest = {
            data: {
                id: 'invalidId',
            },
        };
        await handler.handleTeamsTaskModuleSubmit(context, taskModuleRequest);

        expect(handler.handleTeamsTaskModuleSubmitQuestion).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitUpvote).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitRefreshLeaderboard).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitConfirmEndQnA).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitEndQnA).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitError).toBeCalledTimes(1);
    });
});

describe('handle submit question', () => {
    let handler;
    let context;

    beforeEach(() => {
        jest.clearAllMocks();
        handler = <any>new AskAway(new ConversationDataService(), mockController);
        handler.handleTeamsTaskModuleResubmitQuestion = jest.fn();
        handler._updateMainCard = jest.fn();
        context = {
            activity: {
                from: 'user',
                conversation: {
                    id: 'randomConvoId',
                },
            },
        };
        (<any>mockController.validateConversationId).mockImplementationOnce(() => {
            return true;
        });
    });

    it('non empty question', async () => {
        const taskModuleRequest = {
            data: {
                qnaSessionId: 'randomId',
                usertext: 'user question data',
            },
        };

        const user = {
            name: 'random user name',
            aadObjectId: 'fancyId',
        };

        (<any>mockController.submitNewQuestion).mockImplementationOnce(() => {
            return true;
        });

        expect(await handler.handleTeamsTaskModuleSubmitQuestion(context, user, taskModuleRequest)).toBe(null);

        expect(mockController.submitNewQuestion).toBeCalledTimes(1);
    });

    it('empty question', async () => {
        const taskModuleRequest = {
            data: {
                qnaSessionId: 'randomId',
                usertext: '',
            },
        };

        const user = {
            name: 'random user name',
            aadObjectId: 'fancyId',
        };

        (<any>mockController.submitNewQuestion).mockImplementation(() => {
            return true;
        });

        expect(await handler.handleTeamsTaskModuleSubmitQuestion(context, user, taskModuleRequest)).not.toBe(null);

        expect(handler.handleTeamsTaskModuleResubmitQuestion).toBeCalledTimes(1);
        expect(mockController.submitNewQuestion).toBeCalledTimes(0);
        expect(handler._updateMainCard).toBeCalledTimes(0);
    });

    it('failed submit question', async () => {
        const taskModuleRequest = {
            data: {
                qnaSessionId: 'randomId',
                usertext: 'random question',
            },
        };

        const user = {
            name: 'random user name',
            aadObjectId: 'fancyId',
        };

        (<any>mockController.submitNewQuestion).mockImplementation(() => {
            throw new Error();
        });

        expect(await handler.handleTeamsTaskModuleSubmitQuestion(context, user, taskModuleRequest)).not.toEqual(null);

        expect(handler.handleTeamsTaskModuleResubmitQuestion).toBeCalledTimes(1);
        expect(mockController.submitNewQuestion).toBeCalledTimes(1);
        expect(handler._updateMainCard).toBeCalledTimes(0);
    });
});

test('handle submit upvote', async () => {
    const handler = <any>new AskAway(new ConversationDataService(), mockController);
    handler.handleTeamsTaskModuleResubmitQuestion = jest.fn();
    handler._updateMainCard = jest.fn();
    handler._buildTaskModuleContinueResponse = jest.fn();
    const context = {
        activity: {
            from: {
                name: 'name',
                aadObjectId: 'objId',
            },
            conversation: {
                id: 'randomConvoId',
            },
        },
    };
    const taskModuleRequest = {
        data: {
            questionId: 'randQ',
            qnaSessionId: 'randQnA',
        },
        context: null,
    };
    (<any>mockController.updateUpvote).mockImplementation(() => {
        throw new Error();
    });
    await handler.handleTeamsTaskModuleSubmitUpvote(context, taskModuleRequest);

    expect(mockController.updateUpvote).toBeCalledTimes(1);
    expect(handler._buildTaskModuleContinueResponse).toBeCalledTimes(1);
    expect(adaptiveCardBuilder.getErrorCard).toBeCalledTimes(1);
    expect(adaptiveCardBuilder.getErrorCard).toBeCalledWith(errorStrings('upvoting'));
});

test('handle submit end qna', async () => {
    const handler = <any>new AskAway(new ConversationDataService(), mockController);
    handler.handleTeamsTaskModuleResubmitQuestion = jest.fn();
    handler._updateMainCard = jest.fn();
    handler._buildTaskModuleContinueResponse = jest.fn();
    (<any>mockController.validateConversationId).mockImplementationOnce(() => {
        return true;
    });
    const sampleMeetingId = 'sampleMeetingId';
    (<any>getMeetingIdFromContext) = jest.fn();
    (<any>getMeetingIdFromContext).mockImplementationOnce(() => {
        return sampleMeetingId;
    });
    const context = {
        activity: {
            from: {
                name: 'name',
                aadObjectId: 'objId',
                id: 'sampleId',
            },
            conversation: {
                id: 'randomConvoId',
                tenantId: 'sampleTenantId',
            },
            serviceUrl: 'sampleServiceUrl',
        },
        updateActivity: jest.fn(),
    };
    const taskModuleRequest = {
        data: {
            id: 'submitEndQnA',
            qnaSessionId: 'qnaSessionId',
        },
    };
    (<any>mockController.endQnASession).mockImplementation(() => true);
    await handler.handleTeamsTaskModuleSubmitEndQnA(taskModuleRequest, context);

    expect(mockController.endQnASession).toBeCalledTimes(1);
});

test('bot message preview send', async () => {
    const handler = <any>new AskAway(new ConversationDataService(), mockController);
    handler._extractMainCardFromActivityPreview = jest.fn(() => cardData);
    const sampleMeetingId = 'sampleMeetingId';
    (<any>getMeetingIdFromContext) = jest.fn();
    (<any>getMeetingIdFromContext).mockImplementationOnce(() => {
        return sampleMeetingId;
    });
    const context = {
        activity: {
            from: {
                name: 'name',
                aadObjectId: 'objId',
                id: 'host scope id',
            },
            conversation: {
                id: 'randomConvoId',
                tenantId: 'tenantId',
                coversationType: 'not channel',
            },
            serviceUrl: 'sampleServiceUrl',
        },
        sendActivity: jest.fn(),
    };
    const action = {
        data: {
            id: 'submitEndQnA',
            qnaSessionId: 'qnaSessionId',
        },
    };
    const cardData = {
        title: 'card title',
        description: 'card description',
    };

    (<any>mockController.startQnASession).mockImplementation(() => true);

    await handler.handleTeamsMessagingExtensionBotMessagePreviewSend(context, action);

    expect(mockController.startQnASession).toBeCalledTimes(1);
    expect(mockController.startQnASession).toBeCalledWith({
        title: cardData.title,
        description: cardData.description,
        userName: context.activity.from.name,
        userAadObjectId: context.activity.from.aadObjectId,
        activityId: '',
        conversationId: context.activity.conversation.id,
        tenantId: context.activity.conversation.tenantId,
        scopeId: context.activity.conversation.id,
        hostUserId: context.activity.from.id,
        isChannel: false,
        serviceUrl: context.activity.serviceUrl,
        meetingId: sampleMeetingId,
        caller: EventInitiator.MainCard,
    });
});

describe('messaging extension submit', () => {
    let handler, context;

    beforeEach(() => {
        handler = <any>new AskAway(new ConversationDataService(), mockController);
        context = {
            activity: {
                from: {
                    name: 'name',
                    aadObjectId: 'objId',
                    id: 'host scope id',
                },
            },
        };
        jest.clearAllMocks();
    });

    test('filled title and description', async () => {
        const action = {
            data: {
                title: 'session title',
                description: 'session description',
            },
        };

        const result = await handler.handleTeamsMessagingExtensionSubmitAction(context, action);

        expect(maincardBuilder.getMainCard).toBeCalledTimes(1);
        expect(maincardBuilder.getMainCard).toBeCalledWith(action.data.title, action.data.description, context.activity.from.name, '', context.activity.from.aadObjectId, context.activity.from.id);
        expect(result.composeExtension.type).toBe('botMessagePreview');
    });

    test('unfilled title and filled description', async () => {
        const action = {
            data: {
                title: '',
                description: 'session description',
            },
        };

        await handler.handleTeamsMessagingExtensionSubmitAction(context, action);

        expect(maincardBuilder.getMainCard).toBeCalledTimes(0);
        expect(adaptiveCardBuilder.getStartQnACard).toBeCalledTimes(1);
        expect(adaptiveCardBuilder.getStartQnACard).toBeCalledWith(action.data.title, action.data.description, errorStrings('missingFields'));
    });

    test('filled title and unfilled description', async () => {
        const action = {
            data: {
                title: 'filled',
                description: '',
            },
        };

        await handler.handleTeamsMessagingExtensionSubmitAction(context, action);

        expect(maincardBuilder.getMainCard).toBeCalledTimes(0);
        expect(adaptiveCardBuilder.getStartQnACard).toBeCalledTimes(1);
        expect(adaptiveCardBuilder.getStartQnACard).toBeCalledWith(action.data.title, action.data.description, errorStrings('missingFields'));
    });
});
