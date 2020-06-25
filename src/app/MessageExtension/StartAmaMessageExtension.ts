import {
    TurnContext,
    CardFactory,
    MessagingExtensionResult,
    InputHints,
    MessageFactory,
    TaskModuleContinueResponse,
    teamsGetChannelId,
} from 'botbuilder';
import { IMessagingExtensionMiddlewareProcessor } from 'botbuilder-teams-messagingextensions';
import { TaskModuleRequest } from 'botbuilder';
import {
    startAMASession,
    setActivityId,
    getMasterCard,
    getStartAMACard,
} from '../../Controller';

// Initialize debug logging module

/**
 * Messaging extension that handles starting of an AMA session
 */
export default class StartAmaMessageExtension
    implements IMessagingExtensionMiddlewareProcessor {
    // handle action response in here
    // See documentation for `MessagingExtensionResult` for details
    public async onSubmitAction(
        context: TurnContext,
        value: TaskModuleRequest & {
            botMessagePreviewAction?: string;
            botActivityPreview?: any;
        }
    ): Promise<MessagingExtensionResult> {
        if (value.data) {
            const title = value.data.title,
                description = value.data.description,
                username = context.activity.from.name,
                amaSessionId = '',
                userId = context.activity.from.aadObjectId as string;

            const card = CardFactory.adaptiveCard(
                await getMasterCard(
                    title,
                    description,
                    username,
                    amaSessionId,
                    userId
                )
            );
            return {
                type: 'botMessagePreview',
                activityPreview: MessageFactory.attachment(
                    card,
                    null as any,
                    null as any,
                    InputHints.ExpectingInput
                ),
            } as MessagingExtensionResult;
        } else if (value.botMessagePreviewAction === 'send') {
            // activity payload includes preview attachments
            const attachments = (value as any).botActivityPreview[0]
                .attachments;
            const card = attachments[0].content;
            const cardData = card.body[card.body.length - 1].actions[0].data;

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

            const response = await startAMASession(
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
                    const status = await setActivityId(
                        data.amaSessionId,
                        resource.id
                    );
                    if (status.isErr()) {
                        console.error(status.value);
                    }
                }
            } else {
                // Middleware currently doesn't support returning task module continue
                // TODO: come back to it later once issue is fixed
            }

            return null as any;
        } else if (value.botMessagePreviewAction === 'edit') {
            // Middleware currently doesn't support this.
            // TODO: Come back to it later once issue is fixed.

            // const card = CardFactory.adaptiveCard(getStartAMACard());
            // return Promise.resolve({
            //     type: 'continue',
            //     value: {
            //         card: card,
            //         title: 'Questionly',
            //         height: 225,
            //         width: 600,
            //     },
            // } as any);
            return null as any;
        }

        throw Error('Not Implemented');
    }

    public async onFetchTask(): Promise<
        MessagingExtensionResult | TaskModuleContinueResponse
    > {
        const card = CardFactory.adaptiveCard(getStartAMACard());
        return {
            type: 'continue',
            value: {
                card: card,
                title: 'Questionly',
                height: 225,
                width: 600,
            },
        } as TaskModuleContinueResponse;
    }
}
