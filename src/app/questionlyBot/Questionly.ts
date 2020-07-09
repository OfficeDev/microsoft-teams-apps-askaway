/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    BotDeclaration,
    MessageExtensionDeclaration,
} from 'express-msteams-host';
import * as debug from 'debug';
import {
    CardFactory,
    TurnContext,
    MemoryStorage,
    TeamsActivityHandler,
    TaskModuleResponse,
    TaskModuleRequest,
    ChannelAccount,
} from 'botbuilder';
import StartAmaMessageExtension from '../MessageExtension/StartAmaMessageExtension';
import * as controller from './../../Controller';

// Initialize debug logging module
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const log = debug('msteams');

/**
 * Main bot activity handler class
 */
@BotDeclaration(
    '/api/messages',
    new MemoryStorage(),
    process.env.MICROSOFT_APP_ID,
    process.env.MICROSOFT_APP_PASSWORD
)
export class Questionly extends TeamsActivityHandler {
    /** Local property for StartAmaMessageExtension */
    @MessageExtensionDeclaration('startAMA')
    private _startAmaMessageExtension: StartAmaMessageExtension;

    /**
     * The constructor
     */
    public constructor() {
        super();
        // Message extension StartAmaMessageExtension
        this._startAmaMessageExtension = new StartAmaMessageExtension();
    }

    async handleTeamsTaskModuleFetch(
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        if (taskModuleRequest.data.id === 'viewLeaderboard') {
            /*================================================================================================================================
            A payload of the following format should be in the 'data' field of the 'View Leaderboard' Action.Submit button in the master card.
            {
                msteams: {
                    type: 'task/fetch',
                },
                id: 'viewLeaderboard',
                amaSessionId:
                    <put the amaSessionId here>
                aadObjId:
                    <put the aadObjId here>
            }
            ================================================================================================================================*/
            const leaderboard = await controller.generateLeaderboard(
                taskModuleRequest.data.amaSessionId,
                context.activity.from.aadObjectId as string
            );

            const response: TaskModuleResponse = <TaskModuleResponse>{
                task: {
                    type: 'continue',
                    value: {
                        card: {
                            contentType:
                                'application/vnd.microsoft.card.adaptive',
                            content: leaderboard.value,
                        },
                        title: 'View the Leaderboard',
                    },
                },
            };

            return response;
        } else if (taskModuleRequest.data.id == 'askQuestion') {
            return this._handleTeamsTaskModuleFetchAskQuestion(
                taskModuleRequest
            );
        } else if (taskModuleRequest.data.id == 'endAMA') {
            return this._handleTeamsTaskModuleFetchEndAMA(taskModuleRequest);
        }

        return this._handleTeamsTaskModuleFetchError();
    }

    async handleTeamsTaskModuleSubmit(
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        const user = context.activity.from;
        const endAMAIds = ['submitEndAma', 'cancelEndAma'];

        if (taskModuleRequest.data.id == 'submitQuestion') {
            return this._handleTeamsTaskModuleSubmitQuestion(
                user,
                taskModuleRequest
            );
        } else if (endAMAIds.includes(taskModuleRequest.data.id)) {
            return this._handleTeamsTaskModuleSubmitEndAMA(
                user,
                taskModuleRequest,
                context
            );
        }

        return this._handleTeamsTaskModuleSubmitError();
    }

    private _handleTeamsTaskModuleFetchAskQuestion(
        taskModuleRequest: TaskModuleRequest
    ): TaskModuleResponse {
        const askQuestionResponse: TaskModuleResponse = <TaskModuleResponse>{
            task: {
                type: 'continue',
                value: {
                    card: {
                        contentType: 'application/vnd.microsoft.card.adaptive',
                        content: controller.getNewQuestionCard(
                            taskModuleRequest.data.amaSessionId
                        ),
                    },
                    title: 'Ask a Question',
                },
            },
        };

        return askQuestionResponse;
    }

    private async _handleTeamsTaskModuleSubmitQuestion(
        user: ChannelAccount,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        const amaSessionId = taskModuleRequest.data.amaSessionId;
        const userAADObjId = user.aadObjectId as string;
        const userName = user.name;
        const questionContent = taskModuleRequest.data.usertext as string;

        if (questionContent == null || questionContent.trim() === '') {
            return this._handleTeamsTaskModuleResubmitQuestion(
                amaSessionId,
                ''
            );
        } else {
            const status = await controller.submitNewQuestion(
                amaSessionId,
                userAADObjId,
                userName,
                questionContent
            );
            if (!status.isOk()) {
                return this._handleTeamsTaskModuleResubmitQuestion(
                    amaSessionId,
                    questionContent
                );
            }
            return null as any;
        }
    }

    private _handleTeamsTaskModuleFetchEndAMA(
        taskModuleRequest: TaskModuleRequest
    ): TaskModuleResponse {
        const endAMAResponse: TaskModuleResponse = <TaskModuleResponse>{
            task: {
                type: 'continue',
                value: {
                    card: {
                        contentType: 'application/vnd.microsoft.card.adaptive',
                        content: controller.getEndAMAConfirmationCard(
                            taskModuleRequest.data.amaSessionId
                        ),
                    },
                    title: 'End the AMA',
                },
            },
        };

        return endAMAResponse;
    }

    private async _handleTeamsTaskModuleSubmitEndAMA(
        user: ChannelAccount,
        taskModuleRequest: TaskModuleRequest,
        context: TurnContext
    ): Promise<TaskModuleResponse> {
        const amaSessionId = taskModuleRequest.data.amaSessionId;
        const userName = user.name;

        if (taskModuleRequest.data.id == 'submitEndAma') {
            const status = await controller.endAMASession(amaSessionId);
            if (!status.isOk()) {
                return this._handleTeamsTaskModuleSubmitError();
            } else {
                const amaTitle = status.value.amaTitle;
                const amaDesc = status.value.amaDesc;
                const amaActivityId = status.value.amaActivityId;

                const endAmaMastercard = controller.getEndAMAMastercard(
                    amaTitle,
                    amaDesc,
                    amaSessionId,
                    userName
                );

                await context.updateActivity({
                    attachments: [CardFactory.adaptiveCard(endAmaMastercard)],
                    id: amaActivityId,
                    type: 'message',
                });
            }
        }

        /* if (context.activity.value.data.endAMAToggle == 'true') {
            const status = await controller.endAMASession(amaSessionId);
            if (!status.isOk()) {
                return this._handleTeamsTaskModuleSubmitError();
            } else {
                const amaTitle = status.value.amaTitle;
                const amaDesc = status.value.amaDesc;
                const amaActivityId = status.value.amaActivityId;

                const endAmaMastercard = controller.getEndAMAMastercard(
                    amaTitle,
                    amaDesc,
                    amaSessionId,
                    userName
                );

                await context.updateActivity({
                    attachments: [CardFactory.adaptiveCard(endAmaMastercard)],
                    id: amaActivityId,
                    type: 'message',
                });
            }
        } */

        return null as any;
    }

    private _handleTeamsTaskModuleFetchError(): TaskModuleResponse {
        const taskFetchErrorResponse: TaskModuleResponse = <TaskModuleResponse>{
            task: {
                type: 'continue',
                value: {
                    card: {
                        contentType: 'application/vnd.microsoft.card.adaptive',
                        content: controller.getTaskFetchErrorCard(),
                    },
                },
            },
        };

        return taskFetchErrorResponse;
    }

    private _handleTeamsTaskModuleSubmitError(): TaskModuleResponse {
        const taskSubmitErrorResponse: TaskModuleResponse = <
            TaskModuleResponse
        >{
            task: {
                type: 'continue',
                value: {
                    card: {
                        contentType: 'application/vnd.microsoft.card.adaptive',
                        content: controller.getTaskSubmitErrorCard(),
                    },
                },
            },
        };

        return taskSubmitErrorResponse;
    }

    private _handleTeamsTaskModuleResubmitQuestion(
        amaSessionId: string,
        questionContent: string
    ): TaskModuleResponse {
        const resubmitQuestionResponse: TaskModuleResponse = <
            TaskModuleResponse
        >{
            task: {
                type: 'continue',
                value: {
                    card: {
                        contentType: 'application/vnd.microsoft.card.adaptive',
                        content: controller.getResubmitQuestionCard(
                            amaSessionId,
                            questionContent
                        ),
                    },
                    title: 'Resubmit a Question',
                },
            },
        };

        return resubmitQuestionResponse;
    }
}
