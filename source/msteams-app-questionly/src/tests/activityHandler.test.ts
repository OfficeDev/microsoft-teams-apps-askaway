/* eslint-disable @typescript-eslint/tslint/config */
import { AskAway } from 'src/askAway';
import { TaskModuleRequest } from 'botframework-connector/lib/connectorApi/models';
import {
    submitNewQuestion,
    updateUpvote,
    getErrorCard,
    endQnASession,
    startQnASession,
    getMainCard,
    getStartQnACard,
    validateConversationId,
} from 'src/Controller';
import { ok, err } from 'src/util/resultWrapper';
import { errorStrings, initLocalization } from 'src/localization/locale';

jest.mock('src/controller');

beforeAll(async () => {
    await initLocalization();
});

test('config configured properly', async () => {
    const handler = <any>new AskAway();

    expect(typeof handler._config.updateMainCardDebounceTimeInterval).toBe(
        'number'
    );
    expect(typeof handler._config.updateMainCardDebounceMaxWait).toBe('number');
    expect(typeof handler._config.updateMainCardPostDebounceTimeInterval).toBe(
        'number'
    );
});

describe('teams task module fetch', () => {
    let handler;
    let context;

    beforeEach(() => {
        handler = <any>new AskAway();
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

        expect(
            handler.handleTeamsTaskModuleFetchViewLeaderboard
        ).toBeCalledTimes(1);

        expect(handler.handleTeamsTaskModuleFetchAskQuestion).toBeCalledTimes(
            0
        );
    });

    it('ask question handler triggered', async () => {
        const taskModuleRequest: TaskModuleRequest = {
            data: {
                id: 'askQuestion',
            },
        };

        await handler.handleTeamsTaskModuleFetch(context, taskModuleRequest);

        expect(
            handler.handleTeamsTaskModuleFetchViewLeaderboard
        ).toBeCalledTimes(0);

        expect(handler.handleTeamsTaskModuleFetchAskQuestion).toBeCalledTimes(
            1
        );
    });

    it('returns failed task module fetch', async () => {
        // console.error is supposed to be called
        const taskModuleRequest: TaskModuleRequest = {
            data: {
                id: 'randomInvalidId',
            },
        };

        await handler.handleTeamsTaskModuleFetch(context, taskModuleRequest);

        expect(
            handler.handleTeamsTaskModuleFetchViewLeaderboard
        ).toBeCalledTimes(0);

        expect(handler.handleTeamsTaskModuleFetchAskQuestion).toBeCalledTimes(
            0
        );

        expect(handler.handleTeamsTaskModuleFetchError).toBeCalledTimes(1);
    });
});

// eslint-disable-next-line @typescript-eslint/tslint/config
describe('teams task module submit', () => {
    let handler;
    let context;

    beforeEach(() => {
        handler = <any>new AskAway();
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
        expect(
            handler.handleTeamsTaskModuleSubmitRefreshLeaderboard
        ).toBeCalledTimes(0);
        expect(
            handler.handleTeamsTaskModuleSubmitConfirmEndQnA
        ).toBeCalledTimes(0);
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
        expect(
            handler.handleTeamsTaskModuleSubmitRefreshLeaderboard
        ).toBeCalledTimes(0);
        expect(
            handler.handleTeamsTaskModuleSubmitConfirmEndQnA
        ).toBeCalledTimes(0);
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
        expect(
            handler.handleTeamsTaskModuleSubmitRefreshLeaderboard
        ).toBeCalledTimes(1);
        expect(
            handler.handleTeamsTaskModuleSubmitConfirmEndQnA
        ).toBeCalledTimes(0);
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
        expect(
            handler.handleTeamsTaskModuleSubmitRefreshLeaderboard
        ).toBeCalledTimes(0);
        expect(
            handler.handleTeamsTaskModuleSubmitConfirmEndQnA
        ).toBeCalledTimes(1);
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
        expect(
            handler.handleTeamsTaskModuleSubmitRefreshLeaderboard
        ).toBeCalledTimes(0);
        expect(
            handler.handleTeamsTaskModuleSubmitConfirmEndQnA
        ).toBeCalledTimes(0);
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
        expect(
            handler.handleTeamsTaskModuleSubmitRefreshLeaderboard
        ).toBeCalledTimes(0);
        expect(
            handler.handleTeamsTaskModuleSubmitConfirmEndQnA
        ).toBeCalledTimes(0);
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
        expect(
            handler.handleTeamsTaskModuleSubmitRefreshLeaderboard
        ).toBeCalledTimes(0);
        expect(
            handler.handleTeamsTaskModuleSubmitConfirmEndQnA
        ).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitEndQnA).toBeCalledTimes(0);
        expect(handler.handleTeamsTaskModuleSubmitError).toBeCalledTimes(1);
    });
});

describe('handle submit question', () => {
    let handler;
    let context;

    beforeEach(() => {
        jest.clearAllMocks();
        handler = <any>new AskAway();
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
        (<any>validateConversationId).mockImplementationOnce(() => {
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

        (<any>submitNewQuestion).mockImplementationOnce(() => {
            return ok(true);
        });

        expect(
            await handler.handleTeamsTaskModuleSubmitQuestion(
                context,
                user,
                taskModuleRequest
            )
        ).toBe(null);

        expect(submitNewQuestion).toBeCalledTimes(1);
        expect(submitNewQuestion).toBeCalledWith(
            taskModuleRequest.data.qnaSessionId,
            user.aadObjectId,
            user.name,
            taskModuleRequest.data.usertext
        );
        expect(handler._updateMainCard).toBeCalledTimes(1);
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

        (<any>submitNewQuestion).mockImplementation(() => {
            return ok(true);
        });

        expect(
            await handler.handleTeamsTaskModuleSubmitQuestion(
                context,
                user,
                taskModuleRequest
            )
        ).not.toBe(null);

        expect(handler.handleTeamsTaskModuleResubmitQuestion).toBeCalledTimes(
            1
        );
        expect(submitNewQuestion).toBeCalledTimes(0);
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

        (<any>submitNewQuestion).mockImplementation(() => {
            return err(true);
        });

        expect(
            await handler.handleTeamsTaskModuleSubmitQuestion(
                context,
                user,
                taskModuleRequest
            )
        ).not.toEqual(null);

        expect(handler.handleTeamsTaskModuleResubmitQuestion).toBeCalledTimes(
            1
        );
        expect(submitNewQuestion).toBeCalledTimes(1);
        expect(handler._updateMainCard).toBeCalledTimes(0);
    });
});

test('handle submit upvote', async () => {
    const handler = <any>new AskAway();
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
        },
        context: null,
    };
    (<any>updateUpvote).mockImplementation(() => err(true));
    await handler.handleTeamsTaskModuleSubmitUpvote(context, taskModuleRequest);

    expect(updateUpvote).toBeCalledTimes(1);
    expect(updateUpvote).toBeCalledWith(
        taskModuleRequest.data.questionId,
        context.activity.from.aadObjectId,
        context.activity.from.name,
        'default'
    );
    expect(handler._updateMainCard).toBeCalledTimes(1);
    expect(handler._buildTaskModuleContinueResponse).toBeCalledTimes(1);
    expect(getErrorCard).toBeCalledTimes(1);
    expect(getErrorCard).toBeCalledWith(errorStrings('upvoting'));
});

test('handle submit end qna', async () => {
    const handler = <any>new AskAway();
    handler.handleTeamsTaskModuleResubmitQuestion = jest.fn();
    handler._updateMainCard = jest.fn();
    handler._buildTaskModuleContinueResponse = jest.fn();
    (<any>validateConversationId).mockImplementationOnce(() => {
        return true;
    });
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
        updateActivity: jest.fn(),
    };
    const taskModuleRequest = {
        data: {
            id: 'submitEndQnA',
            qnaSessionId: 'qnaSessionId',
        },
    };
    (<any>endQnASession).mockImplementation(() => ok(true));
    await handler.handleTeamsTaskModuleSubmitEndQnA(taskModuleRequest, context);

    expect(endQnASession).toBeCalledTimes(1);
    expect(endQnASession).toBeCalledWith(
        taskModuleRequest.data.qnaSessionId,
        context.activity.from.aadObjectId
    );
    expect(context.updateActivity).toBeCalledTimes(1);
});

test('bot message preview send', async () => {
    const handler = <any>new AskAway();
    handler._extractMainCardFromActivityPreview = jest.fn(() => ok(cardData));
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

    (<any>startQnASession).mockImplementation(() => ok(true));

    await handler.handleTeamsMessagingExtensionBotMessagePreviewSend(
        context,
        action
    );

    expect(startQnASession).toBeCalledTimes(1);
    expect(startQnASession).toBeCalledWith(
        cardData.title,
        cardData.description,
        context.activity.from.name,
        context.activity.from.aadObjectId,
        '',
        context.activity.conversation.id,
        context.activity.conversation.tenantId,
        context.activity.conversation.id,
        context.activity.from.id,
        false
    );
    expect(context.sendActivity).toBeCalledTimes(1);
});

describe('messaging extension submit', () => {
    let handler, context;

    beforeEach(() => {
        handler = <any>new AskAway();
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

        const result = await handler.handleTeamsMessagingExtensionSubmitAction(
            context,
            action
        );

        expect(getMainCard).toBeCalledTimes(1);
        expect(getMainCard).toBeCalledWith(
            action.data.title,
            action.data.description,
            context.activity.from.name,
            '',
            context.activity.from.aadObjectId,
            context.activity.from.id
        );
        expect(result.composeExtension.type).toBe('botMessagePreview');
    });

    test('unfilled title and filled description', async () => {
        const action = {
            data: {
                title: '',
                description: 'session description',
            },
        };

        await handler.handleTeamsMessagingExtensionSubmitAction(
            context,
            action
        );

        expect(getMainCard).toBeCalledTimes(0);
        expect(getStartQnACard).toBeCalledTimes(1);
        expect(getStartQnACard).toBeCalledWith(
            action.data.title,
            action.data.description,
            errorStrings('missingFields')
        );
    });

    test('filled title and unfilled description', async () => {
        const action = {
            data: {
                title: 'filled',
                description: '',
            },
        };

        await handler.handleTeamsMessagingExtensionSubmitAction(
            context,
            action
        );

        expect(getMainCard).toBeCalledTimes(0);
        expect(getStartQnACard).toBeCalledTimes(1);
        expect(getStartQnACard).toBeCalledWith(
            action.data.title,
            action.data.description,
            errorStrings('missingFields')
        );
    });
});

test('different session id calls different update master card function', () => {
    process.env.UpdateMainCardDebounceTimeInterval = '1000'; // milliseconds
    process.env.UpdateMainCardPostDebounceTimeInterval = '50';
    const handler = <any>new AskAway();
    const context = {
        activity: {
            from: {
                name: 'name',
                aadObjectId: 'objId',
            },
        },
    };
    handler._getHandleMainCardTopQuestion = jest.fn(() => jest.fn());

    const qnaSessionId1 = 'id1';
    const qnaSessionId2 = 'id2';
    handler._updateMainCard(qnaSessionId1, context);
    expect(Object.keys(handler._updateMainCardFunctionMap).length).toBe(1);
    // new qnaSessionId creates new function
    handler._updateMainCard(qnaSessionId2, context);
    expect(Object.keys(handler._updateMainCardFunctionMap).length).toBe(2);
    // calling with existing qnaSessionId calls already defined function
    handler._updateMainCard(qnaSessionId1, context);
    expect(Object.keys(handler._updateMainCardFunctionMap).length).toBe(2);

    // different session id has different functions
    expect(handler._updateMainCardFunctionMap[qnaSessionId1].func).not.toEqual(
        handler._updateMainCardFunctionMap[qnaSessionId2].func
    );

    // called twice
    expect(
        handler._updateMainCardFunctionMap[qnaSessionId1].func
    ).toBeCalledTimes(2);
    expect(
        handler._updateMainCardFunctionMap[qnaSessionId2].func
    ).toBeCalledTimes(1);
});
