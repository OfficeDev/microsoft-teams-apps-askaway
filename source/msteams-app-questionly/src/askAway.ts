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
    BotMessagePreviewType,
} from 'botbuilder';
import { IController } from 'src/controller';
import { AdaptiveCard } from 'adaptivecards';
import { endQnAStrings, askQuestionStrings, errorStrings, startQnAStrings, leaderboardStrings } from 'src/localization/locale';
import { exceptionLogger } from 'src/util/exceptionTracking';
import { IConversationDataService, SessionIsNoLongerActiveError } from 'msteams-app-questionly.data';
import { extractMainCardData, MainCardData } from 'msteams-app-questionly.common';
import { getMeetingIdFromContext, isConverationTypeChannel, isPresenterOrOrganizer } from 'src/util/meetingsUtility';
import { TelemetryExceptions } from 'src/constants/telemetryConstants';
import * as maincardBuilder from 'msteams-app-questionly.common';
import * as adaptiveCardBuilder from 'src/adaptive-cards/adaptiveCardBuilder';
import { EventInitiator } from 'src/enums/eventInitiator';

const getMainCard = maincardBuilder.getMainCard;
const getStartQnACard = adaptiveCardBuilder.getStartQnACard;
const getErrorCard = adaptiveCardBuilder.getErrorCard;

const NULL_RESPONSE: any = null;
/**
 * Main bot activity handler class
 */
export class AskAway extends TeamsActivityHandler {
    private controller: IController;

    /**
     * The constructor
     * @param conversationDataService - conversation data service
     */
    public constructor(conversationDataService: IConversationDataService, controller: IController) {
        super();
        this.controller = controller;
        this.onMembersAdded(async (context, next) => {
            const activity = context.activity;
            const membersAdded = activity.membersAdded;

            if (membersAdded === undefined) {
                exceptionLogger(`membersAdded undefined for activity id ${activity.id}`);
                await next();
                return;
            }

            try {
                for (const member of membersAdded) {
                    if (member.id === context.activity.recipient.id) {
                        await conversationDataService.createConversationData(activity.conversation.id, activity.serviceUrl, activity.conversation.tenantId, activity.channelData?.meeting?.id);
                    }
                }
            } catch (error) {
                exceptionLogger(error);
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersRemoved(async (context, next) => {
            const activity = context.activity;
            const membersRemoved = activity.membersRemoved;

            if (membersRemoved === undefined) {
                exceptionLogger(`membersRemoved undefined for activity id ${activity.id}`);
                await next();
                return;
            }

            try {
                for (const member of membersRemoved) {
                    if (member.id === context.activity.recipient.id) {
                        await conversationDataService.deleteConversationData(activity.conversation.id);
                    }
                }
            } catch (error) {
                exceptionLogger(error);
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    private _buildTaskModuleContinueResponse = (adaptiveCard: AdaptiveCard, title?: string): TaskModuleResponse => {
        return <TaskModuleResponse>{
            task: {
                // `type` should actually be of type `BotMessagePreviewType`, it's a bug on the Sdk's end
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

    async handleTeamsTaskModuleFetch(context: TurnContext, taskModuleRequest: TaskModuleRequest): Promise<TaskModuleResponse> {
        // The following function call assumes the task/fetch request is interacting with an existing QnA session and thus the data property of
        // the taskModuleRequest has a qnaSessionId property which stores the DBID of the QnA session the request is interacting with.
        // This is to prevent spoofing of data from users who don't belong to a conversation that a particular QnA is taking place in.
        // If you wish to add different task/fetch handlers which do not interact with an existing QnA session, do so and return before the
        // following if statement.
        try {
            if (process.env.debugMode !== 'true') {
                const conversationIdValid = await this.controller.validateConversationId(taskModuleRequest.data.qnaSessionId, context.activity.conversation.id);
                if (!conversationIdValid) {
                    return this._buildTaskModuleContinueResponse(getErrorCard(errorStrings('conversationInvalid')));
                }
            }
        } catch (error) {
            exceptionLogger(new Error(`Check Conversation Validation Failed: ${error}`), {
                conversationId: context.activity.conversation.id,
                qnaSessionId: taskModuleRequest.data?.qnaSessionId,
                userAadObjectId: context.activity.from.aadObjectId,
                isChannel: isConverationTypeChannel(context),
                meetingId: getMeetingIdFromContext(context),
                filename: module.id,
                exceptionName: TelemetryExceptions.ConversationValidationFailed,
            });
            return this.handleTeamsTaskModuleFetchError();
        }

        if (taskModuleRequest.data.id === 'viewLeaderboard') return await this.handleTeamsTaskModuleFetchViewLeaderboard(context, taskModuleRequest);
        else if (taskModuleRequest.data.id == 'askQuestion') return this.handleTeamsTaskModuleFetchAskQuestion(context, taskModuleRequest);

        exceptionLogger(new Error('Invalid Task Fetch'));
        return this.handleTeamsTaskModuleFetchError();
    }

    async handleTeamsTaskModuleSubmit(context: TurnContext, taskModuleRequest: TaskModuleRequest): Promise<TaskModuleResponse> {
        // The following function call assumes the task/submit request is interacting with an existing QnA session and thus the data property of
        // the taskModuleRequest has a qnaSessionId property which stores the DBID of the QnA session the request is interacting with.
        // This is to prevent spoofing of data from users who don't belong to a conversation that a particular QnA is taking place in.
        // If you wish to add different task/submit handlers which do not interact with an existing QnA session, do so and return before the
        // following if statement.
        try {
            if (process.env.debugMode !== 'true') {
                const conversationIdValid = await this.controller.validateConversationId(taskModuleRequest.data.qnaSessionId, context.activity.conversation.id);
                if (!conversationIdValid) {
                    return this._buildTaskModuleContinueResponse(getErrorCard(errorStrings('conversationInvalid')));
                }
            }
        } catch (error) {
            exceptionLogger(new Error(`Check Conversation Validation Failed: ${error}`), {
                conversationId: context.activity.conversation.id,
                qnaSessionId: taskModuleRequest.data?.qnaSessionId,
                userAadObjectId: <string>context.activity.from.aadObjectId,
                isChannel: isConverationTypeChannel(context),
                meetingId: getMeetingIdFromContext(context),
                filename: module.id,
                exceptionName: TelemetryExceptions.ConversationValidationFailed,
            });
            return this.handleTeamsTaskModuleFetchError();
        }

        const user = context.activity.from;
        const endQnAIds = ['submitEndQnA', 'cancelEndQnA'];

        if (taskModuleRequest.data.id == 'submitQuestion') return this.handleTeamsTaskModuleSubmitQuestion(context, user, taskModuleRequest);
        else if (taskModuleRequest.data.id === 'upvote') return await this.handleTeamsTaskModuleSubmitUpvote(context, taskModuleRequest);
        else if (taskModuleRequest.data.id == 'refreshLeaderboard') return await this.handleTeamsTaskModuleSubmitRefreshLeaderboard(context, taskModuleRequest);
        else if (taskModuleRequest.data.id == 'confirmEndQnA') return this.handleTeamsTaskModuleSubmitConfirmEndQnA(context, taskModuleRequest);
        else if (endQnAIds.includes(taskModuleRequest.data.id)) return this.handleTeamsTaskModuleSubmitEndQnA(taskModuleRequest, context);

        exceptionLogger(new Error('Invalid Task Submit'));

        return this.handleTeamsTaskModuleSubmitError();
    }

    // -------------------------------------------------------------------------- //
    //                         ANCHOR task/fetch handlers                         //
    // -------------------------------------------------------------------------- //

    private handleTeamsTaskModuleFetchViewLeaderboard = async (context: TurnContext, taskModuleRequest: TaskModuleRequest): Promise<TaskModuleResponse> => {
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

        try {
            const leaderboard = await this.controller.generateLeaderboard(
                taskModuleRequest.data.qnaSessionId,
                <string>context.activity.from.aadObjectId,
                taskModuleRequest.context ? <string>taskModuleRequest.context.theme : 'default'
            );
            return this._buildTaskModuleContinueResponse(leaderboard, leaderboardStrings('taskModuleTitle'));
        } catch (error) {
            exceptionLogger(error, {
                conversationId: context.activity.conversation.id,
                qnaSessionId: taskModuleRequest.data?.qnaSessionId,
                userAadObjectId: <string>context.activity.from.aadObjectId,
                isChannel: isConverationTypeChannel(context),
                meetingId: getMeetingIdFromContext(context),
                filename: module.id,
                exceptionName: TelemetryExceptions.ViewLeaderboardFailed,
            });
            return this._buildTaskModuleContinueResponse(getErrorCard(errorStrings('leaderboard')));
        }
    };

    private async handleTeamsTaskModuleFetchAskQuestion(context: TurnContext, taskModuleRequest: TaskModuleRequest): Promise<TaskModuleResponse> {
        return this._buildTaskModuleContinueResponse(this.controller.getNewQuestionCard(taskModuleRequest.data.qnaSessionId), askQuestionStrings('taskModuleTitle'));
    }

    private handleTeamsTaskModuleFetchError(): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(getErrorCard(errorStrings('taskFetch')));
    }

    // -------------------------------------------------------------------------- //
    //                         ANCHOR task/submit handlers                        //
    // -------------------------------------------------------------------------- //

    private async handleTeamsTaskModuleSubmitQuestion(context: TurnContext, user: ChannelAccount, taskModuleRequest: TaskModuleRequest): Promise<TaskModuleResponse> {
        if (!(await this.controller.validateConversationId(taskModuleRequest.data.qnaSessionId, context.activity.conversation.id)))
            return this._buildTaskModuleContinueResponse(getErrorCard(errorStrings('conversationInvalid')));

        const qnaSessionId = taskModuleRequest.data.qnaSessionId;
        const userAadObjectId = <string>user.aadObjectId;
        const userName = user.name;
        const questionContent = <string>taskModuleRequest.data.usertext;
        const conversationId = context.activity.conversation.id;

        if (questionContent == null || questionContent.trim() === '') {
            return this.handleTeamsTaskModuleResubmitQuestion(qnaSessionId, '');
        }

        try {
            await this.controller.submitNewQuestion(
                qnaSessionId,
                userAadObjectId,
                userName,
                questionContent,
                conversationId,
                context.activity.serviceUrl,
                EventInitiator.MainCard,
                getMeetingIdFromContext(context)
            );
        } catch (error) {
            exceptionLogger(error, {
                conversationId: conversationId,
                qnaSessionId: qnaSessionId,
                questionContent: questionContent,
                userAadObjectId: userAadObjectId,
                isChannel: isConverationTypeChannel(context),
                meetingId: getMeetingIdFromContext(context),
                filename: module.id,
                exceptionName: TelemetryExceptions.CreateQuestionFailed,
            });

            if (error instanceof SessionIsNoLongerActiveError) {
                return this.handleTeamsTaskModuleSessionIsNoMoreActiveError();
            } else {
                return this.handleTeamsTaskModuleResubmitQuestion(qnaSessionId, questionContent);
            }
        }
        return NULL_RESPONSE;
    }

    private handleTeamsTaskModuleSubmitUpvote = async (context: TurnContext, taskModuleRequest: TaskModuleRequest): Promise<TaskModuleResponse> => {
        try {
            const updatedLeaderboard = await this.controller.updateUpvote(
                taskModuleRequest.data.qnaSessionId,
                taskModuleRequest.data.questionId,
                <string>context.activity.from.aadObjectId,
                context.activity.from.name,
                context.activity.conversation.id,
                taskModuleRequest.context ? <string>taskModuleRequest.context.theme : 'default',
                context.activity.serviceUrl,
                EventInitiator.MainCard,
                getMeetingIdFromContext(context)
            );

            return this._buildTaskModuleContinueResponse(updatedLeaderboard);
        } catch (error) {
            exceptionLogger(error, {
                conversationId: context.activity.conversation.id,
                qnaSessionId: taskModuleRequest.data?.qnaSessionId,
                questionId: taskModuleRequest.data?.questionId,
                userAadObjectId: <string>context.activity.from.aadObjectId,
                isChannel: isConverationTypeChannel(context),
                meetingId: getMeetingIdFromContext(context),
                filename: module.id,
                exceptionName: TelemetryExceptions.VoteQuestionFailed,
            });

            if (error instanceof SessionIsNoLongerActiveError) {
                return this.handleTeamsTaskModuleSessionIsNoMoreActiveError();
            } else {
                return this._buildTaskModuleContinueResponse(getErrorCard(errorStrings('upvoting')));
            }
        }
    };

    private async handleTeamsTaskModuleSubmitConfirmEndQnA(context: TurnContext, taskModuleRequest: TaskModuleRequest): Promise<TaskModuleResponse> {
        if (!(await this.controller.validateConversationId(taskModuleRequest.data.qnaSessionId, context.activity.conversation.id)))
            return this._buildTaskModuleContinueResponse(getErrorCard(errorStrings('conversationInvalid')));

        return this._buildTaskModuleContinueResponse(this.controller.getEndQnAConfirmationCard(taskModuleRequest.data.qnaSessionId), endQnAStrings('taskModuleTitle'));
    }

    private async handleTeamsTaskModuleSubmitEndQnA(taskModuleRequest: TaskModuleRequest, context: TurnContext): Promise<TaskModuleResponse> {
        if (!(await this.controller.validateConversationId(taskModuleRequest.data.qnaSessionId, context.activity.conversation.id)))
            return this._buildTaskModuleContinueResponse(getErrorCard(errorStrings('conversationInvalid')));

        const conversation = context.activity.conversation;
        const qnaSessionId = taskModuleRequest.data.qnaSessionId,
            meetingId = getMeetingIdFromContext(context);

        if (taskModuleRequest.data.id == 'submitEndQnA') {
            try {
                await this.controller.endQnASession({
                    qnaSessionId: qnaSessionId,
                    aadObjectId: <string>context.activity.from.aadObjectId,
                    conversationId: context.activity.conversation.id,
                    tenantId: conversation.tenantId,
                    serviceURL: context.activity.serviceUrl,
                    userName: context.activity.from.name,
                    endedByUserId: context.activity.from.id,
                    meetingId: meetingId,
                    caller: EventInitiator.MainCard,
                });
            } catch (error) {
                exceptionLogger(error, {
                    conversationId: context.activity.conversation.id,
                    qnaSessionId: qnaSessionId,
                    tenantId: conversation.tenantId,
                    userAadObjectId: context.activity.from.aadObjectId,
                    isChannel: isConverationTypeChannel(context),
                    meetingId: meetingId,
                    filename: module.id,
                    exceptionName: TelemetryExceptions.EndQnASessionFailed,
                });

                if (error instanceof SessionIsNoLongerActiveError) {
                    return this.handleTeamsTaskModuleSessionIsNoMoreActiveError();
                } else {
                    return this.handleTeamsTaskModuleSubmitError();
                }
            }
        }

        return NULL_RESPONSE;
    }

    private handleTeamsTaskModuleSessionIsNoMoreActiveError(): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(getErrorCard(errorStrings('unableToPerformActivityOnEndedSession')));
    }

    private handleTeamsTaskModuleSubmitError(): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(getErrorCard(errorStrings('taskSubmit')));
    }

    private handleTeamsTaskModuleResubmitQuestion(qnaSessionId: string, questionContent: string): TaskModuleResponse {
        return this._buildTaskModuleContinueResponse(this.controller.getResubmitQuestionCard(qnaSessionId, questionContent), askQuestionStrings('resubmitTaskModuleTitle'));
    }

    private async handleTeamsTaskModuleSubmitRefreshLeaderboard(context: TurnContext, taskModuleRequest: TaskModuleRequest): Promise<TaskModuleResponse> {
        return await this.handleTeamsTaskModuleFetchViewLeaderboard(context, taskModuleRequest);
    }

    // -------------------------------------------------------------------------- //
    //          ANCHOR Bot Framework messaging extension method overrides         //
    // -------------------------------------------------------------------------- //

    async handleTeamsMessagingExtensionFetchTask(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        // commandId: 'startQnA'
        const meetingId = getMeetingIdFromContext(context);
        // Only presenters and organizers can start a Q&A session in meeting chat.
        if (meetingId && !(await isPresenterOrOrganizer(meetingId, <string>context.activity.from.aadObjectId, context.activity.conversation.tenantId, context.activity.serviceUrl))) {
            return this._buildTaskModuleContinueResponse(getErrorCard(errorStrings('insufficientPermissionsToCreateOrEndQnASessionError')));
        } else {
            return this._buildTaskModuleContinueResponse(getStartQnACard(), startQnAStrings('taskModuleTitle'));
        }
    }

    async handleTeamsMessagingExtensionBotMessagePreviewEdit(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        const cardDataResponse = this._extractMainCardFromActivityPreview(action);
        let cardData: Partial<MainCardData>;

        if (cardDataResponse) cardData = cardDataResponse;
        else {
            exceptionLogger(new Error('Unable to extract maincard data' + cardDataResponse));
            cardData = { title: '', description: '' };
        }

        return this._buildTaskModuleContinueResponse(getStartQnACard(cardData.title, cardData.description), startQnAStrings('taskModuleTitleEdit'));
    }

    async handleTeamsMessagingExtensionBotMessagePreviewSend(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        const cardDataResponse = this._extractMainCardFromActivityPreview(action);
        let cardData: MainCardData | { title: string; description: string };

        // if starting QnA from reply chain, update conversation id so that card is sent to channel as a new conversation
        const conversation = context.activity.conversation,
            conversationId = conversation.id,
            tenantId = conversation.tenantId,
            userAadObjectId = <string>context.activity.from.aadObjectId;

        if (conversationId.match('messageid') !== null)
            // true if conversation is a reply chain
            context.activity.conversation.id = conversationId.split(';')[0];

        if (cardDataResponse) cardData = cardDataResponse;
        else {
            // this error will create a broken experience for the user and so
            // the QnA session will not be created.
            exceptionLogger(new Error('Unable to extract maincard data' + cardDataResponse), {
                tenantId: tenantId,
                conversationId: conversationId,
                userAadObjectId: userAadObjectId,
                isChannel: isConverationTypeChannel(context),
                meetingId: getMeetingIdFromContext(context),
                filename: module.id,
                exceptionName: TelemetryExceptions.CreateQnASessionFailed,
            });
            return NULL_RESPONSE;
        }

        const title = cardData.title,
            description = cardData.description,
            userName = context.activity.from.name,
            activityId = '',
            isChannel = isConverationTypeChannel(context),
            hostUserId = context.activity.from.id,
            scopeId = isChannel ? teamsGetChannelId(context.activity) : conversation.id,
            serviceURL = context.activity.serviceUrl,
            meetingId = getMeetingIdFromContext(context);

        try {
            await this.controller.startQnASession({
                title: title,
                description: description,
                userName: userName,
                userAadObjectId: userAadObjectId,
                activityId: activityId,
                conversationId: context.activity.conversation.id,
                tenantId: tenantId,
                scopeId: scopeId!,
                hostUserId: hostUserId,
                isChannel: isChannel,
                serviceUrl: serviceURL,
                meetingId: meetingId,
                caller: EventInitiator.MainCard,
            });
        } catch (error) {
            exceptionLogger(error, {
                activityId: activityId,
                tenantId: tenantId,
                conversationId: conversationId,
                hostUserId: hostUserId,
                userAadObjectId: userAadObjectId,
                isChannel: isChannel,
                meetingId: meetingId,
                filename: module.id,
                exceptionName: TelemetryExceptions.CreateQnASessionFailed,
            });

            await this.handleCreateQnaSessionFailure(context, error);
        }

        return NULL_RESPONSE;
    }

    /**
     * handles error occurred in create qna session flow, sends appropriate response.
     * @param context - turnContext.
     * @param error - error occured while creating a session.
     */
    async handleCreateQnaSessionFailure(context: TurnContext, error: Error) {
        let errorMessage: string;
        switch (error['code']) {
            case 'QnASessionLimitExhaustedError': {
                errorMessage = errorStrings('qnasessionlimitexhaustedError');
                break;
            }
            case 'InsufficientPermissionsToCreateOrEndQnASession': {
                errorMessage = errorStrings('insufficientPermissionsToCreateOrEndQnASessionError');
                break;
            }
            case 'RevertOperationFailedAfterBackgroundJobFailureError': {
                errorMessage = errorStrings('unableToPostCardForSessionStartedEvent');
                break;
            }
            default: {
                errorMessage = errorStrings('qnasessionCreationError');
            }
        }

        context.sendActivity(errorMessage);
    }

    async handleTeamsMessagingExtensionSubmitAction(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
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
            hostUserId = context.activity.from.id;

        if (!(title && description)) return this._buildTaskModuleContinueResponse(getStartQnACard(title, description, errorStrings('missingFields')));

        const card = CardFactory.adaptiveCard(await getMainCard(title, description, username, qnaSessionId, userId, hostUserId));

        return {
            composeExtension: {
                type: 'botMessagePreview',
                activityPreview: <Activity>MessageFactory.attachment(card, '', '', InputHints.ExpectingInput),
            },
        };
    }

    // -------------------------------------------------------------------------- //
    //                         ANCHOR Other helper methods                        //
    // -------------------------------------------------------------------------- //

    private _extractMainCardFromActivityPreview = (action: MessagingExtensionAction): MainCardData | null => {
        if (!action.botActivityPreview || !action.botActivityPreview[0].attachments) {
            return null;
        }

        const attachments = action.botActivityPreview[0].attachments;
        return extractMainCardData(attachments[0].content);
    };
}
