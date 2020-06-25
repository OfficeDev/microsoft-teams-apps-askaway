/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    BotDeclaration,
    MessageExtensionDeclaration,
} from 'express-msteams-host';
import * as debug from 'debug';
import {
    StatePropertyAccessor,
    CardFactory,
    TurnContext,
    MemoryStorage,
    ConversationState,
    TeamsActivityHandler,
    TaskModuleResponse,
    TaskModuleRequest,
} from 'botbuilder';
import StartAmaMessageExtension from '../MessageExtension/StartAmaMessageExtension';

import * as controller from './../../Controller';

// Initialize debug logging module
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const log = debug('msteams');

/**
 * Implementation for Questionly
 */
@BotDeclaration(
    '/api/messages',
    new MemoryStorage(),
    process.env.MICROSOFT_APP_ID,
    process.env.MICROSOFT_APP_PASSWORD
)
export class Questionly extends TeamsActivityHandler {
    private readonly conversationState: ConversationState;
    /** Local property for StartAmaMessageExtension */
    @MessageExtensionDeclaration('startAmaMessageExtension')
    private _startAmaMessageExtension: StartAmaMessageExtension;

    /**
     * The constructor
     * @param conversationState
     */
    public constructor(conversationState: ConversationState) {
        super();
        // Message extension StartAmaMessageExtension
        this._startAmaMessageExtension = new StartAmaMessageExtension();

        this.conversationState = conversationState;
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
                    },
                },
            };

            return response;
        } else if (taskModuleRequest.data.id == 'askQuestion') {
            /*================================================================================================================================
            A payload of the following format should be in the 'data' field of the 'Ask a Question' Action.Submit button in the master card.
            {
                msteams: {
                    type: 'task/fetch',
                },
                id: 'askQuestion',
                amaSessionId:
                    <put the amaSessionId here>
            }
            ================================================================================================================================*/
            const response: TaskModuleResponse = <TaskModuleResponse>{
                task: {
                    type: 'continue',
                    value: {
                        card: CardFactory.adaptiveCard(
                            controller.getNewQuestionCard(
                                taskModuleRequest.data.amaSessionId
                            )
                        ),
                        height: 220,
                        width: 700,
                    },
                },
            };

            return response;
        } else {
            const response: TaskModuleResponse = <TaskModuleResponse>{
                task: {
                    type: 'continue',
                    value: {
                        card: {
                            contentType:
                                'application/vnd.microsoft.card.adaptive',
                            content: controller.getInvalidTaskFetch(),
                        },
                    },
                },
            };

            return response;
        }
    }

    async handleTeamsTaskModuleSubmit(
        context: TurnContext,
        taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        const user = context.activity.from;
        const amaSessionId = taskModuleRequest.data.amaSessionId;
        const userAadObjId = user.aadObjectId;
        const userName = user.name;
        const questionContent = taskModuleRequest.data.usertext;

        const status = await controller.submitNewQuestion(
            amaSessionId,
            userAadObjId as string,
            userName,
            questionContent
        );

        if (status.isOk()) {
            const response: TaskModuleResponse = <TaskModuleResponse>{
                task: {
                    type: 'message',
                    value:
                        'Submitted! You asked: ' +
                        taskModuleRequest.data.usertext,
                },
            };

            return response;
        }

        const errorResponse: TaskModuleResponse = <TaskModuleResponse>{
            task: {
                type: 'continue',
                value: {
                    card: CardFactory.adaptiveCard(
                        controller.getQuestionErrorCard()
                    ),
                },
            },
        };

        return errorResponse;
    }
}
