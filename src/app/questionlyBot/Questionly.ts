import { BotDeclaration } from 'express-msteams-host';
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
import { clone, debounce, delay } from 'lodash';
import * as controller from './../../Controller';
import { AdaptiveCard } from 'adaptivecards';
import {
    extractMasterCardData,
    MasterCardData,
} from '../../AdaptiveCards/MasterCard';
import { Result, err } from '../../util';
import { aiClient } from '../server';

// Initialize debug logging module
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
    // Each AMA sesion gets mapped to a unique function used to update the Master Card.
    private _updateMasterCardFunctionMap: {
        [key: string]: {
            func: (context: TurnContext, amaSessionId: string) => void;
            timeLastUpdated: number;
        };
    };

    private _config: {
        updateMasterCardDebounceTimeInterval: number;
        updateMasterCardDebounceMaxWait: number;
        updateMasterCardPostDebounceTimeInterval: number;
    };
    /**
     * The constructor
     */
    public constructor() {
        super();
        this._updateMasterCardFunctionMap = {};

        const env = process.env;
        const maxWait = env.updateMasterCardDebounceMaxWait;
        const timeInterval = env.updateMasterCardDebounceTimeInterval;
        const postTimeInterval = env.updateMasterCardPostDebounceTimeInterval;
        this._config = {
            updateMasterCardDebounceTimeInterval: timeInterval
                ? Number(timeInterval)
                : 15000,
            updateMasterCardDebounceMaxWait: maxWait ? Number(maxWait) : 20000,
            updateMasterCardPostDebounceTimeInterval: postTimeInterval
                ? Number(postTimeInterval)
                : 5000,
        };
    }

    private _buildTaskModuleContinueResponse = (
        adaptiveCard: AdaptiveCard,
        title?: string
    ): TaskModuleResponse => {
        return <TaskModuleResponse>{
            task: {
                type: 'continue',
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
        if (taskModuleRequest.data.id === 'viewLeaderboard')
            return await this._handleTeamsTaskModuleFetchViewLeaderboard(
                context,
                taskModuleRequest
            );
        else if (taskModuleRequest.data.id == 'askQuestion')
            return this._handleTeamsTaskModuleFetchAskQuestion(
                taskModuleRequest
            );

        aiClient.trackException({ exception: new Error('Invalid Task Fetch') });
        return this._handleTeamsTaskModuleFetchError();
    }

    async handleTeamsTaskModuleSubmit(
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        const user = context.activity.from;
        const endAMAIds = ['submitEndAma', 'cancelEndAma'];

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
        else if (taskModuleRequest.data.id == 'confirmEndAMA')
            return this._handleTeamsTaskModuleSubmitConfirmEndAMA(
                taskModuleRequest
            );
        else if (endAMAIds.includes(taskModuleRequest.data.id))
            return this._handleTeamsTaskModuleSubmitEndAMA(
                taskModuleRequest,
                context
            );

        aiClient.trackException({
            exception: new Error('Invalid Task Submit'),
        });

        return this._handleTeamsTaskModuleSubmitError();
    }

    private _handleTeamsTaskModuleFetchAskQuestion(
        taskModuleRequest: TaskModuleRequest
    ): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(
            controller.getNewQuestionCard(taskModuleRequest.data.amaSessionId),
            'Ask a question'
        );
    }

    private async _handleTeamsTaskModuleSubmitQuestion(
        context,
        user: ChannelAccount,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        const amaSessionId = taskModuleRequest.data.amaSessionId;
        const userAADObjId = user.aadObjectId as string;
        const userName = user.name;
        const questionContent = taskModuleRequest.data.usertext as string;

        if (questionContent == null || questionContent.trim() === '')
            return this._handleTeamsTaskModuleResubmitQuestion(
                amaSessionId,
                ''
            );

        const status = await controller.submitNewQuestion(
            amaSessionId,
            userAADObjId,
            userName,
            questionContent
        );

        this._updateMasterCard(taskModuleRequest.data.amaSessionId, context);

        if (!status.isOk())
            return this._handleTeamsTaskModuleResubmitQuestion(
                amaSessionId,
                questionContent
            );

        return null as any;
    }

    private async _handleTeamsTaskModuleSubmitConfirmEndAMA(
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        return this._buildTaskModuleContinueResponse(
            controller.getEndAMAConfirmationCard(
                taskModuleRequest.data.amaSessionId
            ),
            'End session'
        );
    }

    private async _handleTeamsTaskModuleSubmitEndAMA(
        taskModuleRequest: TaskModuleRequest,
        context: TurnContext
    ): Promise<TaskModuleResponse> {
        const amaSessionId = taskModuleRequest.data.amaSessionId;

        if (taskModuleRequest.data.id == 'submitEndAma') {
            const result = await controller.endAMASession(amaSessionId);

            if (result.isErr()) return this._handleTeamsTaskModuleSubmitError();

            await context.updateActivity({
                attachments: [CardFactory.adaptiveCard(result.value.card)],
                id: result.value.activityId,
                type: 'message',
            });
        }

        return null as any;
    }

    private _handleTeamsTaskModuleFetchError(): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(
            controller.getTaskFetchErrorCard()
        );
    }

    private _handleTeamsTaskModuleSubmitError(): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(
            controller.getTaskSubmitErrorCard()
        );
    }

    private _handleTeamsTaskModuleResubmitQuestion(
        amaSessionId: string,
        questionContent: string
    ): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(
            controller.getResubmitQuestionCard(amaSessionId, questionContent),
            'Ask a question'
        );
    }

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
            amaSessionId:
                <put the amaSessionId here>
        }
        ================================================================================================================================*/

        const isHostAndActive = await this._isHostAndActive(
            taskModuleRequest,
            context
        );

        const isHost = isHostAndActive[0];
        const isActiveAMA = isHostAndActive[1];

        if (isHost.isOk() && isActiveAMA.isOk()) {
            const leaderboard = await controller.generateLeaderboard(
                taskModuleRequest.data.amaSessionId,
                context.activity.from.aadObjectId as string,
                isHost.value,
                isActiveAMA.value
            );

            const response: TaskModuleResponse = leaderboard.isOk()
                ? this._buildTaskModuleContinueResponse(
                      leaderboard.value,
                      'View questions and upvote'
                  )
                : this._buildTaskModuleContinueResponse(
                      controller.getErrorCard(leaderboard.value.message),
                      'View questions and upvote'
                  );

            return response;
        }

        return this._buildTaskModuleContinueResponse(
            controller.getErrorCard(
                'Could not retrieve leaderboard. Please try again'
            )
        );
    };

    private _handleTeamsTaskModuleSubmitUpvote = async (
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> => {
        const isHostAndActive = await this._isHostAndActive(
            taskModuleRequest,
            context
        );

        const isHost = isHostAndActive[0];
        const isActiveAMA = isHostAndActive[1];

        if (isHost.isOk() && isActiveAMA.isOk()) {
            const updatedLeaderboard = await controller.addUpvote(
                taskModuleRequest.data.questionId,
                context.activity.from.aadObjectId as string,
                context.activity.from.name,
                isHost.value,
                isActiveAMA.value
            );

            this._updateMasterCard(
                taskModuleRequest.data.amaSessionId,
                context
            );

            return updatedLeaderboard.isOk()
                ? this._buildTaskModuleContinueResponse(
                      updatedLeaderboard.value
                  )
                : this._buildTaskModuleContinueResponse(
                      controller.getErrorCard(
                          'Upvoting failed. Please try again.'
                      )
                  );
        }

        return this._buildTaskModuleContinueResponse(
            controller.getErrorCard('Upvoting failed. Please try again.')
        );
    };

    async handleTeamsMessagingExtensionFetchTask(): Promise<
        MessagingExtensionActionResponse
    > {
        // commandId: 'startAMA'
        return this._buildTaskModuleContinueResponse(
            controller.getStartAMACard(),
            'Start session to gather questions'
        );
    }

    async handleTeamsMessagingExtensionBotMessagePreviewEdit(
        context: TurnContext,
        action: MessagingExtensionAction
    ): Promise<MessagingExtensionActionResponse> {
        const cardDataResponse = this._extractMasterCardFromActivityPreveiw(
            action
        );
        let cardData: Partial<MasterCardData>;

        if (cardDataResponse.isOk()) cardData = cardDataResponse.value;
        else {
            aiClient.trackException({
                exception: new Error(
                    'Unable to extract mastercard data' + cardDataResponse.value
                ),
            });
            cardData = { title: '', description: '' };
        }

        return this._buildTaskModuleContinueResponse(
            controller.getStartAMACard(cardData.title, cardData.description),
            'Edit details'
        );
    }

    async handleTeamsMessagingExtensionBotMessagePreviewSend(
        context: TurnContext,
        action: MessagingExtensionAction
    ): Promise<MessagingExtensionActionResponse> {
        const cardDataResponse = this._extractMasterCardFromActivityPreveiw(
            action
        );
        let cardData: MasterCardData | { title: string; description: string };

        // if starting AMA from reply chain, update conversation id so that card is sent to channel as a new conversation
        const conversationId = context.activity.conversation.id;
        if (conversationId.match('messageid') !== null)
            // true if conversation is a reply chain
            context.activity.conversation.id = conversationId.split(';')[0];

        if (cardDataResponse.isOk()) cardData = cardDataResponse.value;
        else {
            // this error will create a broken experience for the user and so
            // the AMA session will not be created.
            aiClient.trackException({
                exception: new Error(
                    'Unable to extract mastercard data' + cardDataResponse.value
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
                await controller.setActivityId(data.amaSessionId, resource.id);
            }
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

        if (!(title && description))
            return this._buildTaskModuleContinueResponse(
                controller.getStartAMACard(
                    title,
                    description,
                    'Fields cannot be empty'
                )
            );

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

    /**
     * Handles proactively updating the master card with the top questions.
     * @param context - Current bot turn context.
     * @param amaSessionId - AMA session database document id.
     */
    private _getHandleMasterCardTopQuestion = () => {
        const _function = async (
            context: TurnContext,
            amaSessionId: string
        ) => {
            const updatedMastercard = await controller.getUpdatedMasterCard(
                amaSessionId
            );

            if (updatedMastercard.isOk()) {
                this._updateMasterCardFunctionMap[
                    amaSessionId
                ].timeLastUpdated = Date.now();

                const card = CardFactory.adaptiveCard(
                    updatedMastercard.value.card
                );

                try {
                    await context.updateActivity({
                        id: updatedMastercard.value.activityId,
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
            this._config.updateMasterCardDebounceTimeInterval,
            {
                leading: true,
                trailing: true,
                maxWait: this._config.updateMasterCardDebounceMaxWait,
            }
        );
    };

    private _updateMasterCard = (
        amaSessionId: string,
        context: TurnContext
    ) => {
        const _context = clone(context);
        if (!(amaSessionId in this._updateMasterCardFunctionMap)) {
            this._updateMasterCardFunctionMap[amaSessionId] = {
                func: this._getHandleMasterCardTopQuestion(),
                timeLastUpdated: 0,
            };
        }

        const map = this._updateMasterCardFunctionMap[amaSessionId];
        if (
            Date.now() - map.timeLastUpdated <
            this._config.updateMasterCardPostDebounceTimeInterval
        )
            delay(
                () => map.func(_context, amaSessionId),
                this._config.updateMasterCardPostDebounceTimeInterval
            );
        else map.func(_context, amaSessionId);
    };

    private _extractMasterCardFromActivityPreveiw = (
        action: MessagingExtensionAction
    ): Result<MasterCardData, null> => {
        if (
            !action.botActivityPreview ||
            !action.botActivityPreview[0].attachments
        )
            return err(null);
        const attachments = action.botActivityPreview[0].attachments;
        return extractMasterCardData(attachments[0].content);
    };

    private _isHostAndActive = async (
        taskModuleRequest: TaskModuleRequest,
        context: TurnContext
    ): Promise<Array<Result<any, Error>>> => {
        const amaSessionId = taskModuleRequest.data.amaSessionId;
        const userAadObjId = context.activity.from.aadObjectId as string;

        const isHost = await controller.isHost(amaSessionId, userAadObjId);
        const isActiveAMA = await controller.isActiveAMA(
            taskModuleRequest.data.amaSessionId
        );

        return [isHost, isActiveAMA];
    };
}
