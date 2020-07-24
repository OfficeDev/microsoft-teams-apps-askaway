import {
    CardFactory,
    TurnContext,
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
    BotMessagePreviewActionType,
} from 'botbuilder';
import { clone, debounce, delay } from 'lodash';
import * as controller from '../../Controller';
import { AdaptiveCard } from 'adaptivecards';
import {
    extractMainCardData,
    MainCardData,
} from '../../AdaptiveCards/MainCard';
import { Result, err } from '../../util/ResultWrapper';
import {
    endQnAStrings,
    askQuestionStrings,
    errorStrings,
    startQnAStrings,
    leaderboardStrings,
} from '../../localization/locale';
import { aiClient } from '../server';
import { ifNumber } from '../../util/RetryPolicies';

/**
 * Main bot activity handler class
 */
export class AskAway extends TeamsActivityHandler {
    /** Local property for StartQnAMessageExtension */
    // Each QnA sesion gets mapped to a unique function used to update the Master Card.
    private _updateMainCardFunctionMap: {
        [key: string]: {
            func: (context: TurnContext, qnaSessionId: string) => void;
            timeLastUpdated: number;
        };
    };

    private _config: {
        updateMainCardDebounceTimeInterval: number;
        updateMainCardDebounceMaxWait: number;
        updateMainCardPostDebounceTimeInterval: number;
    };
    /**
     * The constructor
     */
    public constructor() {
        super();
        this._updateMainCardFunctionMap = {};

        const env = process.env;
        const maxWait = env.UpdateMainCardDebounceMaxWait;
        const timeInterval = env.UpdateMainCardDebounceTimeInterval;
        const postTimeInterval = env.UpdateMainCardPostDebounceTimeInterval;
        this._config = {
            updateMainCardDebounceTimeInterval: ifNumber(timeInterval, 15000),
            updateMainCardDebounceMaxWait: ifNumber(maxWait, 20000),
            updateMainCardPostDebounceTimeInterval: ifNumber(
                postTimeInterval,
                5000
            ),
        };
    }

    private _buildTaskModuleContinueResponse = (
        adaptiveCard: AdaptiveCard,
        title?: string
    ): TaskModuleResponse => {
        return <TaskModuleResponse>{
            task: {
                // `type` should actually be of type `BotMessagePreviewType`, it's a bug on the Sdk's end
                type: ('continue' as unknown) as BotMessagePreviewActionType,
                value: {
                    card: {
                        contentType: 'application/vnd.microsoft.card.adaptive',
                        content: adaptiveCard,
                    },
                    title,
                },
            },
        };
    };

    async handleTeamsTaskModuleFetch(
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        // The following function call assumes the task/fetch request is interacting with an existing QnA session and thus the data property of
        // the taskModuleRequest has a qnaSessionId property which stores the DBID of the QnA session the request is interacting with.
        // This is to prevent spoofing of data from users who don't belong to a conversation that a particular QnA is taking place in.
        // If you wish to add different task/fetch handlers which do not interact with an existing QnA session, do so and return before the
        // following if statement.
        const conversationIdValid = await controller.validateConversationId(
            taskModuleRequest.data.qnaSessionId,
            context.activity.conversation.id
        );

        if (conversationIdValid.isOk()) {
            if (!conversationIdValid.value)
                return this._buildTaskModuleContinueResponse(
                    controller.getErrorCard(errorStrings('conversationInvalid'))
                );
        } else {
            return this._buildTaskModuleContinueResponse(
                controller.getErrorCard(errorStrings('taskSubmit'))
            );
        }

        if (taskModuleRequest.data.id === 'viewLeaderboard')
            return await this._handleTeamsTaskModuleFetchViewLeaderboard(
                context,
                taskModuleRequest
            );
        else if (taskModuleRequest.data.id == 'askQuestion')
            return this._handleTeamsTaskModuleFetchAskQuestion(
                context,
                taskModuleRequest
            );

        aiClient.trackException({ exception: new Error('Invalid Task Fetch') });
        return this._handleTeamsTaskModuleFetchError();
    }

    async handleTeamsTaskModuleSubmit(
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        // The following function call assumes the task/submit request is interacting with an existing QnA session and thus the data property of
        // the taskModuleRequest has a qnaSessionId property which stores the DBID of the QnA session the request is interacting with.
        // This is to prevent spoofing of data from users who don't belong to a conversation that a particular QnA is taking place in.
        // If you wish to add different task/submit handlers which do not interact with an existing QnA session, do so and return before the
        // following if statement.
        const conversationIdValid = await controller.validateConversationId(
            taskModuleRequest.data.qnaSessionId,
            context.activity.conversation.id
        );

        if (conversationIdValid.isOk()) {
            if (!conversationIdValid.value)
                return this._buildTaskModuleContinueResponse(
                    controller.getErrorCard(errorStrings('conversationInvalid'))
                );
        } else {
            return this._buildTaskModuleContinueResponse(
                controller.getErrorCard(errorStrings('taskSubmit'))
            );
        }

        const user = context.activity.from;
        const endQnAIds = ['submitEndQnA', 'cancelEndQnA'];

        if (taskModuleRequest.data.id == 'submitQuestion')
            return this._handleTeamsTaskModuleSubmitQuestion(
                context,
                user,
                taskModuleRequest
            );
        else if (taskModuleRequest.data.id === 'upvote')
            return await this._handleTeamsTaskModuleSubmitUpvote(
                context,
                taskModuleRequest
            );
        else if (taskModuleRequest.data.id == 'confirmEndQnA')
            return this._handleTeamsTaskModuleSubmitConfirmEndQnA(
                context,
                taskModuleRequest
            );
        else if (endQnAIds.includes(taskModuleRequest.data.id))
            return this._handleTeamsTaskModuleSubmitEndQnA(
                taskModuleRequest,
                context
            );

        aiClient.trackException({
            exception: new Error('Invalid Task Submit'),
        });

        return this._handleTeamsTaskModuleSubmitError();
    }

    /* -------------------------------------------------------------------------- */
    /*                         ANCHOR task/fetch handlers                         */
    /* -------------------------------------------------------------------------- */

    private _handleTeamsTaskModuleFetchViewLeaderboard = async (
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> => {
        /*================================================================================================================================
        A payload of the following format should be in the 'data' field of the 'View Leaderboard' Action.Submit button in the master card.
        {
            msteams: {
                type: 'task/fetch',
            },
            id: 'viewLeaderboard',
            qnaSessionId:
                <put the qnaSessionId here>
        }
        ================================================================================================================================*/

        const leaderboard = await controller.generateLeaderboard(
            taskModuleRequest.data.qnaSessionId,
            context.activity.from.aadObjectId as string
        );

        const response: TaskModuleResponse = leaderboard.isOk()
            ? this._buildTaskModuleContinueResponse(
                  leaderboard.value,
                  leaderboardStrings('taskModuleTitle')
              )
            : this._buildTaskModuleContinueResponse(
                  controller.getErrorCard(errorStrings('leaderboard'))
              );

        return response;
    };

    private async _handleTeamsTaskModuleFetchAskQuestion(
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        return this._buildTaskModuleContinueResponse(
            controller.getNewQuestionCard(taskModuleRequest.data.qnaSessionId),
            askQuestionStrings('taskModuleTitle')
        );
    }

    private _handleTeamsTaskModuleFetchError(): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(
            controller.getErrorCard(errorStrings('taskFetch'))
        );
    }

    /* -------------------------------------------------------------------------- */
    /*                         ANCHOR task/submit handlers                        */
    /* -------------------------------------------------------------------------- */

    private async _handleTeamsTaskModuleSubmitQuestion(
        context,
        user: ChannelAccount,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        const qnaSessionId = taskModuleRequest.data.qnaSessionId;
        const userAADObjId = user.aadObjectId as string;
        const userName = user.name;
        const questionContent = taskModuleRequest.data.usertext as string;

        if (questionContent == null || questionContent.trim() === '')
            return this._handleTeamsTaskModuleResubmitQuestion(
                qnaSessionId,
                ''
            );

        const status = await controller.submitNewQuestion(
            qnaSessionId,
            userAADObjId,
            userName,
            questionContent
        );

        this._updateMainCard(taskModuleRequest.data.qnaSessionId, context);

        if (!status.isOk())
            return this._handleTeamsTaskModuleResubmitQuestion(
                qnaSessionId,
                questionContent
            );

        return null as any;
    }

    private _handleTeamsTaskModuleSubmitUpvote = async (
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> => {
        const updatedLeaderboard = await controller.addUpvote(
            taskModuleRequest.data.questionId,
            context.activity.from.aadObjectId as string,
            context.activity.from.name
        );

        this._updateMainCard(taskModuleRequest.data.qnaSessionId, context);

        return updatedLeaderboard.isOk()
            ? this._buildTaskModuleContinueResponse(updatedLeaderboard.value)
            : this._buildTaskModuleContinueResponse(
                  controller.getErrorCard(errorStrings('upvoting'))
              );
    };

    private async _handleTeamsTaskModuleSubmitConfirmEndQnA(
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        return this._buildTaskModuleContinueResponse(
            controller.getEndQnAConfirmationCard(
                taskModuleRequest.data.qnaSessionId
            ),
            endQnAStrings('taskModuleTitle')
        );
    }

    private async _handleTeamsTaskModuleSubmitEndQnA(
        taskModuleRequest: TaskModuleRequest,
        context: TurnContext
    ): Promise<TaskModuleResponse> {
        const qnaSessionId = taskModuleRequest.data.qnaSessionId;

        if (taskModuleRequest.data.id == 'submitEndQnA') {
            const result = await controller.endQnASession(
                qnaSessionId,
                context.activity.from.aadObjectId as string
            );

            if (result.isErr()) return this._handleTeamsTaskModuleSubmitError();

            await context.updateActivity({
                attachments: [CardFactory.adaptiveCard(result.value.card)],
                id: result.value.activityId,
                type: 'message',
            });
        }

        return null as any;
    }

    private _handleTeamsTaskModuleSubmitError(): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(
            controller.getErrorCard(errorStrings('taskSubmit'))
        );
    }

    private _handleTeamsTaskModuleResubmitQuestion(
        qnaSessionId: string,
        questionContent: string
    ): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(
            controller.getResubmitQuestionCard(qnaSessionId, questionContent),
            askQuestionStrings('resubmitTaskModuleTitle')
        );
    }

    /* -------------------------------------------------------------------------- */
    /*          ANCHOR Bot Framework messaging extension method overrides         */
    /* -------------------------------------------------------------------------- */

    async handleTeamsMessagingExtensionFetchTask(): Promise<
        MessagingExtensionActionResponse
    > {
        // commandId: 'startQnA'
        return this._buildTaskModuleContinueResponse(
            controller.getStartQnACard(),
            startQnAStrings('taskModuleTitle')
        );
    }

    async handleTeamsMessagingExtensionBotMessagePreviewEdit(
        context: TurnContext,
        action: MessagingExtensionAction
    ): Promise<MessagingExtensionActionResponse> {
        const cardDataResponse = this._extractMainCardFromActivityPreview(
            action
        );
        let cardData: Partial<MainCardData>;

        if (cardDataResponse.isOk()) cardData = cardDataResponse.value;
        else {
            aiClient.trackException({
                exception: new Error(
                    'Unable to extract maincard data' + cardDataResponse.value
                ),
            });
            cardData = { title: '', description: '' };
        }

        return this._buildTaskModuleContinueResponse(
            controller.getStartQnACard(cardData.title, cardData.description),
            startQnAStrings('taskModuleTitleEdit')
        );
    }

    async handleTeamsMessagingExtensionBotMessagePreviewSend(
        context: TurnContext,
        action: MessagingExtensionAction
    ): Promise<MessagingExtensionActionResponse> {
        const cardDataResponse = this._extractMainCardFromActivityPreview(
            action
        );
        let cardData: MainCardData | { title: string; description: string };

        // if starting QnA from reply chain, update conversation id so that card is sent to channel as a new conversation
        const conversationId = context.activity.conversation.id;
        if (conversationId.match('messageid') !== null)
            // true if conversation is a reply chain
            context.activity.conversation.id = conversationId.split(';')[0];

        if (cardDataResponse.isOk()) cardData = cardDataResponse.value;
        else {
            // this error will create a broken experience for the user and so
            // the QnA session will not be created.
            aiClient.trackException({
                exception: new Error(
                    'Unable to extract maincard data' + cardDataResponse.value
                ),
            });
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

        const response = await controller.startQnASession(
            title,
            description,
            userName,
            userAadObjId,
            activityId,
            context.activity.conversation.id,
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
                await controller.setActivityId(data.qnaSessionId, resource.id);
            }
        }

        return null as any;
    }

    async handleTeamsMessagingExtensionSubmitAction(
        context: TurnContext,
        action: MessagingExtensionAction
    ): Promise<MessagingExtensionActionResponse> {
        /*================================================================================================================================
            The following elements must be in the `StartQnACard`:
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
            qnaSessionId = '',
            userId = context.activity.from.aadObjectId as string;

        if (!(title && description))
            return this._buildTaskModuleContinueResponse(
                controller.getStartQnACard(
                    title,
                    description,
                    errorStrings('missingFields')
                )
            );

        const card = CardFactory.adaptiveCard(
            await controller.getMainCard(
                title,
                description,
                username,
                qnaSessionId,
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

    /* -------------------------------------------------------------------------- */
    /*                         ANCHOR Other helper methods                        */
    /* -------------------------------------------------------------------------- */

    /**
     * Handles proactively updating the master card with the top questions.
     * @param context - Current bot turn context.
     * @param qnaSessionId - QnA session database document id.
     */
    private _getHandleMainCardTopQuestion = () => {
        const _function = async (
            context: TurnContext,
            qnaSessionId: string
        ) => {
            const updatedMaincard = await controller.getUpdatedMainCard(
                qnaSessionId
            );

            if (updatedMaincard.isOk()) {
                this._updateMainCardFunctionMap[
                    qnaSessionId
                ].timeLastUpdated = Date.now();

                const card = CardFactory.adaptiveCard(
                    updatedMaincard.value.card
                );

                try {
                    await context.updateActivity({
                        id: updatedMaincard.value.activityId,
                        attachments: [card],
                        type: 'message',
                    });
                } catch (error) {
                    aiClient.trackException({ exception: error });
                }
            }
        };

        return debounce(
            _function,
            this._config.updateMainCardDebounceTimeInterval,
            {
                leading: true,
                trailing: true,
                maxWait: this._config.updateMainCardDebounceMaxWait,
            }
        );
    };

    private _updateMainCard = (qnaSessionId: string, context: TurnContext) => {
        const _context = clone(context);
        if (!(qnaSessionId in this._updateMainCardFunctionMap)) {
            this._updateMainCardFunctionMap[qnaSessionId] = {
                func: this._getHandleMainCardTopQuestion(),
                timeLastUpdated: 0,
            };
        }

        const map = this._updateMainCardFunctionMap[qnaSessionId];
        if (
            Date.now() - map.timeLastUpdated <
            this._config.updateMainCardPostDebounceTimeInterval
        )
            delay(
                () => map.func(_context, qnaSessionId),
                this._config.updateMainCardPostDebounceTimeInterval
            );
        else map.func(_context, qnaSessionId);
    };

    private _extractMainCardFromActivityPreview = (
        action: MessagingExtensionAction
    ): Result<MainCardData, null> => {
        if (
            !action.botActivityPreview ||
            !action.botActivityPreview[0].attachments
        )
            return err(null);
        const attachments = action.botActivityPreview[0].attachments;
        return extractMainCardData(attachments[0].content);
    };
}
