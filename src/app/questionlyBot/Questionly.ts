import { BotDeclaration } from 'express-msteams-host';
import * as debug from 'debug';
import {
    CardFactory,
    TurnContext,
    MemoryStorage,
    TeamsActivityHandler,
    TaskModuleResponse,
    TaskModuleRequest,
    MessagingExtensionAction,
    MessagingExtensionActionResponse,
    teamsGetChannelId,
    MessageFactory,
    InputHints,
    Activity,
    ChannelAccount,
} from 'botbuilder';
import * as controller from './../../Controller';
import { AdaptiveCard } from 'adaptivecards';
import { extractMasterCardData } from '../../AdaptiveCards/MasterCard';

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
    /**
     * The constructor
     */
    public constructor() {
        super();
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
        }
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
            }

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

    async handleTeamsMessagingExtensionFetchTask(): Promise<
        MessagingExtensionActionResponse
    > {
        // commandId: 'startAMA'
        return this._buildTaskModuleContinueResponse(
            controller.getStartAMACard()
        );
    }

    async handleTeamsMessagingExtensionBotMessagePreviewEdit(
        context: TurnContext,
        action: MessagingExtensionAction
    ): Promise<MessagingExtensionActionResponse> {
        // activity payload includes preview attachments
        if (
            !action.botActivityPreview ||
            !action.botActivityPreview[0].attachments
        )
            return null as any;
        const attachments = action.botActivityPreview[0].attachments;
        const cardDataResponse = extractMasterCardData(attachments[0].content);
        let cardData;

        if (cardDataResponse.isOk()) {
            cardData = cardDataResponse.value;
        } else {
            // cardDataResponse.isErr()
            console.error(
                'Unable to extract master card data: ' + cardDataResponse.value
            );
            cardData = { title: '', description: '' };
        }

        return this._buildTaskModuleContinueResponse(
            controller.getStartAMACard(cardData.title, cardData.description)
        );
    }

    async handleTeamsMessagingExtensionBotMessagePreviewSend(
        context: TurnContext,
        action: MessagingExtensionAction
    ): Promise<MessagingExtensionActionResponse> {
        // commandId - 'startAMA'
        if (
            !action.botActivityPreview ||
            !action.botActivityPreview[0].attachments
        )
            return null as any;
        // activity payload includes preview attachments
        const attachments = action.botActivityPreview[0].attachments;
        const cardDataResponse = extractMasterCardData(attachments[0].content);
        let cardData;

        if (cardDataResponse.isOk()) {
            cardData = cardDataResponse.value;
        } else {
            // this error will create a broken experience for the user and so
            // the AMA session will not be created.
            console.error(
                'Unable to extract master card data' + cardDataResponse.value
            );
            return null as any;
        }

        const conversation = context.activity.conversation;
        const title = cardData.title,
            description = cardData.description,
            userName = context.activity.from.name,
            userAadObjId = context.activity.from.aadObjectId as string,
            activityId = '',
            tenantId = conversation.tenantId,
            isChannel = conversation.conversationType === 'channel',
            scopeId = isChannel
                ? teamsGetChannelId(context.activity)
                : conversation.id;

        const response = await controller.startAMASession(
            title,
            description,
            userName,
            userAadObjId,
            activityId,
            tenantId,
            scopeId,
            isChannel
        );

        if (response.isOk()) {
            const data = response.value;
            const resource = await context.sendActivity({
                attachments: [CardFactory.adaptiveCard(data.card)],
            });
            if (resource !== undefined) {
                const status = await controller.setActivityId(
                    data.amaSessionId,
                    resource.id
                );
                if (status.isErr()) {
                    console.error(status.value);
                }
            }
        } else {
            // response.isErr();
            console.error(response.value);
        }

        return null as any;
    }

    async handleTeamsMessagingExtensionSubmitAction(
        context: TurnContext,
        action: MessagingExtensionAction
    ): Promise<MessagingExtensionActionResponse> {
        /*================================================================================================================================
            The following elements must be in the `StartAMACard`:
            {
                type: 'Input.Text',
                id: 'title',
            },
            {
                type: 'Input.Text',
                id: 'description',
            },
        ================================================================================================================================*/
        const value = action;
        const title = value.data.title.trim(),
            description = value.data.description.trim(),
            username = context.activity.from.name,
            amaSessionId = '',
            userId = context.activity.from.aadObjectId as string;

        if (!(title && description)) {
            return this._buildTaskModuleContinueResponse(
                controller.getStartAMACard(
                    title,
                    description,
                    'Please fill out all fields'
                )
            );
        }

        const card = CardFactory.adaptiveCard(
            await controller.getMasterCard(
                title,
                description,
                username,
                amaSessionId,
                userId
            )
        );
        return {
            composeExtension: {
                type: 'botMessagePreview',
                activityPreview: MessageFactory.attachment(
                    card,
                    null as any,
                    null as any,
                    InputHints.ExpectingInput
                ) as Activity,
            },
        };
    }

    private _buildTaskModuleContinueResponse = (
        adaptiveCard: AdaptiveCard,
        height?: number,
        width?: number
    ): TaskModuleResponse => {
        return <TaskModuleResponse>{
            task: {
                type: 'continue',
                value: {
                    card: {
                        contentType: 'application/vnd.microsoft.card.adaptive',
                        content: adaptiveCard,
                        height,
                        width,
                    },
                },
            },
        };
    };
}
