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
import * as controller from 'src/Controller';
import { AdaptiveCard } from 'adaptivecards';
import { extractMainCardData, MainCardData } from 'src/adaptive-cards/mainCard';
import { Result, err, ok } from 'src/util/ResultWrapper';
import {
    endQnAStrings,
    askQuestionStrings,
    errorStrings,
    startQnAStrings,
    leaderboardStrings,
} from 'src/localization/locale';
import { exceptionLogger } from 'src/util/ExceptionTracking';
import { ifNumber } from 'src/util/RetryPolicies';

const NULL_RESPONSE: any = null;
/**
 * Main bot activity handler class
 */
export class AskAway extends TeamsActivityHandler {
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
                type: <BotMessagePreviewActionType>(<unknown>'continue'),
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
        try {
            if (process.env.debugMode !== 'true') {
                const result = await this._checkConversationValid(
                    taskModuleRequest.data.qnaSessionId,
                    context.activity.conversation.id
                );
                if (result.isErr()) return result.value;
            }
        } catch (error) {
            exceptionLogger(
                new Error(`Check Conversation Validation Failed: ${error}`)
            );
            return this.handleTeamsTaskModuleFetchError();
        }

        if (taskModuleRequest.data.id === 'viewLeaderboard')
            return await this.handleTeamsTaskModuleFetchViewLeaderboard(
                context,
                taskModuleRequest
            );
        else if (taskModuleRequest.data.id == 'askQuestion')
            return this.handleTeamsTaskModuleFetchAskQuestion(
                context,
                taskModuleRequest
            );

        exceptionLogger(new Error('Invalid Task Fetch'));
        return this.handleTeamsTaskModuleFetchError();
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
        try {
            if (process.env.debugMode !== 'true') {
                const result = await this._checkConversationValid(
                    taskModuleRequest.data.qnaSessionId,
                    context.activity.conversation.id
                );
                if (result.isErr()) {
                    return result.value;
                }
            }
        } catch (error) {
            exceptionLogger(
                new Error(`Check Conversation Validation Failed: ${error}`)
            );
            return this.handleTeamsTaskModuleFetchError();
        }

        const user = context.activity.from;
        const endQnAIds = ['submitEndQnA', 'cancelEndQnA'];

        if (taskModuleRequest.data.id == 'submitQuestion')
            return this.handleTeamsTaskModuleSubmitQuestion(
                context,
                user,
                taskModuleRequest
            );
        else if (taskModuleRequest.data.id === 'upvote')
            return await this.handleTeamsTaskModuleSubmitUpvote(
                context,
                taskModuleRequest
            );
        else if (taskModuleRequest.data.id == 'refreshLeaderboard')
            return await this.handleTeamsTaskModuleSubmitRefreshLeaderboard(
                context,
                taskModuleRequest
            );
        else if (taskModuleRequest.data.id == 'confirmEndQnA')
            return this.handleTeamsTaskModuleSubmitConfirmEndQnA(
                context,
                taskModuleRequest
            );
        else if (endQnAIds.includes(taskModuleRequest.data.id))
            return this.handleTeamsTaskModuleSubmitEndQnA(
                taskModuleRequest,
                context
            );

        exceptionLogger(new Error('Invalid Task Submit'));

        return this.handleTeamsTaskModuleSubmitError();
    }

    // -------------------------------------------------------------------------- //
    //                         ANCHOR task/fetch handlers                         //
    // -------------------------------------------------------------------------- //

    private handleTeamsTaskModuleFetchViewLeaderboard = async (
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
            <string>context.activity.from.aadObjectId,
            taskModuleRequest.context
                ? <string>taskModuleRequest.context.theme
                : 'default'
        );

        return leaderboard.isOk()
            ? this._buildTaskModuleContinueResponse(
                  leaderboard.value,
                  leaderboardStrings('taskModuleTitle')
              )
            : this._buildTaskModuleContinueResponse(
                  controller.getErrorCard(errorStrings('leaderboard'))
              );
    };

    private async handleTeamsTaskModuleFetchAskQuestion(
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        return this._buildTaskModuleContinueResponse(
            controller.getNewQuestionCard(taskModuleRequest.data.qnaSessionId),
            askQuestionStrings('taskModuleTitle')
        );
    }

    private handleTeamsTaskModuleFetchError(): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(
            controller.getErrorCard(errorStrings('taskFetch'))
        );
    }

    // -------------------------------------------------------------------------- //
    //                         ANCHOR task/submit handlers                        //
    // -------------------------------------------------------------------------- //

    private async handleTeamsTaskModuleSubmitQuestion(
        context,
        user: ChannelAccount,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        if (
            !(await controller.validateConversationId(
                taskModuleRequest.data.qnaSessionId,
                context.activity.conversation.id
            ))
        )
            return this._buildTaskModuleContinueResponse(
                controller.getErrorCard(errorStrings('conversationInvalid'))
            );

        const qnaSessionId = taskModuleRequest.data.qnaSessionId;
        const userAADObjId = <string>user.aadObjectId;
        const userName = user.name;
        const questionContent = <string>taskModuleRequest.data.usertext;

        if (questionContent == null || questionContent.trim() === '')
            return this.handleTeamsTaskModuleResubmitQuestion(qnaSessionId, '');

        const status = await controller.submitNewQuestion(
            qnaSessionId,
            userAADObjId,
            userName,
            questionContent
        );

        if (!status.isOk())
            return this.handleTeamsTaskModuleResubmitQuestion(
                qnaSessionId,
                questionContent
            );

        this._updateMainCard(taskModuleRequest.data.qnaSessionId, context);

        return NULL_RESPONSE;
    }

    private handleTeamsTaskModuleSubmitUpvote = async (
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> => {
        const updatedLeaderboard = await controller.updateUpvote(
            taskModuleRequest.data.questionId,
            <string>context.activity.from.aadObjectId,
            context.activity.from.name,
            taskModuleRequest.context
                ? <string>taskModuleRequest.context.theme
                : 'default'
        );

        this._updateMainCard(taskModuleRequest.data.qnaSessionId, context);

        return updatedLeaderboard.isOk()
            ? this._buildTaskModuleContinueResponse(updatedLeaderboard.value)
            : this._buildTaskModuleContinueResponse(
                  controller.getErrorCard(errorStrings('upvoting'))
              );
    };

    private async handleTeamsTaskModuleSubmitConfirmEndQnA(
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        if (
            !(await controller.validateConversationId(
                taskModuleRequest.data.qnaSessionId,
                context.activity.conversation.id
            ))
        )
            return this._buildTaskModuleContinueResponse(
                controller.getErrorCard(errorStrings('conversationInvalid'))
            );

        return this._buildTaskModuleContinueResponse(
            controller.getEndQnAConfirmationCard(
                taskModuleRequest.data.qnaSessionId
            ),
            endQnAStrings('taskModuleTitle')
        );
    }

    private async handleTeamsTaskModuleSubmitEndQnA(
        taskModuleRequest: TaskModuleRequest,
        context: TurnContext
    ): Promise<TaskModuleResponse> {
        if (
            !(await controller.validateConversationId(
                taskModuleRequest.data.qnaSessionId,
                context.activity.conversation.id
            ))
        )
            return this._buildTaskModuleContinueResponse(
                controller.getErrorCard(errorStrings('conversationInvalid'))
            );

        const qnaSessionId = taskModuleRequest.data.qnaSessionId;

        if (taskModuleRequest.data.id == 'submitEndQnA') {
            const result = await controller.endQnASession(
                qnaSessionId,
                <string>context.activity.from.aadObjectId
            );

            if (result.isErr()) return this.handleTeamsTaskModuleSubmitError();

            await context.updateActivity({
                attachments: [CardFactory.adaptiveCard(result.value.card)],
                id: result.value.activityId,
                type: 'message',
            });
        }

        return NULL_RESPONSE;
    }

    private handleTeamsTaskModuleSubmitError(): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(
            controller.getErrorCard(errorStrings('taskSubmit'))
        );
    }

    private handleTeamsTaskModuleResubmitQuestion(
        qnaSessionId: string,
        questionContent: string
    ): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(
            controller.getResubmitQuestionCard(qnaSessionId, questionContent),
            askQuestionStrings('resubmitTaskModuleTitle')
        );
    }

    private async handleTeamsTaskModuleSubmitRefreshLeaderboard(
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        return await this.handleTeamsTaskModuleFetchViewLeaderboard(
            context,
            taskModuleRequest
        );
    }

    // -------------------------------------------------------------------------- //
    //          ANCHOR Bot Framework messaging extension method overrides         //
    // -------------------------------------------------------------------------- //

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
            exceptionLogger(
                new Error(
                    'Unable to extract maincard data' + cardDataResponse.value
                )
            );
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
            exceptionLogger(
                new Error(
                    'Unable to extract maincard data' + cardDataResponse.value
                )
            );
            return NULL_RESPONSE;
        }

        const conversation = context.activity.conversation;
        const title = cardData.title,
            description = cardData.description,
            userName = context.activity.from.name,
            userAadObjId = <string>context.activity.from.aadObjectId,
            activityId = '',
            tenantId = conversation.tenantId,
            isChannel = conversation.conversationType === 'channel',
            hostUserId = context.activity.from.id,
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
            hostUserId,
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

        return NULL_RESPONSE;
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
            userId = <string>context.activity.from.aadObjectId,
            hostUserId = <string>context.activity.from.id;

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
                userId,
                hostUserId
            )
        );

        return {
            composeExtension: {
                type: 'botMessagePreview',
                activityPreview: <Activity>(
                    MessageFactory.attachment(
                        card,
                        NULL_RESPONSE,
                        NULL_RESPONSE,
                        InputHints.ExpectingInput
                    )
                ),
            },
        };
    }

    // -------------------------------------------------------------------------- //
    //                         ANCHOR Other helper methods                        //
    // -------------------------------------------------------------------------- //

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
                    exceptionLogger(error);
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

    private _checkConversationValid = async (
        qnaSessionId: string,
        conversationId: string
    ): Promise<Result<boolean, TaskModuleResponse>> => {
        const conversationIdValid = await controller.validateConversationId(
            qnaSessionId,
            conversationId
        );

        if (conversationIdValid.isOk()) {
            if (!conversationIdValid.value)
                return err(
                    this._buildTaskModuleContinueResponse(
                        controller.getErrorCard(
                            errorStrings('conversationInvalid')
                        )
                    )
                );
        } else {
            return err(
                this._buildTaskModuleContinueResponse(
                    controller.getErrorCard(errorStrings('taskSubmit'))
                )
            );
        }

        // conversation id valid
        return ok(true);
    };
}
