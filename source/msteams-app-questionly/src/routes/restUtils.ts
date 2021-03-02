import { BotFrameworkAdapter, ConversationReference, ConversationAccount, TeamsChannelAccount, TeamsInfo } from 'botbuilder';
import { Request } from 'express';
import { verifyUserFromConversationId } from 'msteams-app-questionly.common';
import { IConversation } from 'msteams-app-questionly.data';
import { TelemetryExceptions } from 'src/constants/telemetryConstants';
import { ConversationDoesNotBelongToMeetingChatError } from 'src/errors/conversationDoesNotBelongToMeetingChatError';
import { ParameterMissingInRequestError } from 'src/errors/parameterMissingInRequestError';
import { UserIsNotPartOfConversationError } from 'src/errors/userIsNotPartOfConversationError';
import { exceptionLogger } from 'src/util/exceptionTracking';
import { getMicrosoftAppPassword } from 'src/util/keyvault';
import { isValidStringParameter } from 'src/util/typeUtility';

/**
 * Ensures if conversation belongs to meeting chat.
 * @param conversationData - Conversation data.
 */
export const ensureConversationBelongsToMeetingChat = (conversationData: IConversation) => {
    if (!isValidStringParameter(conversationData.meetingId)) {
        throw new ConversationDoesNotBelongToMeetingChatError();
    }
};

/**
 * Returns parameter from request body if present else throws error.
 * @param req - request
 * @param parameterName - parameter name
 * @returns - parameter value from request.
 * @throws - throws error is valid parameter is not present in the request.
 */
export const getAndEnsureRequestBodyContainsParameter = (req: Request, parameterName: string): string => {
    if (!isValidStringParameter(req.body[parameterName])) {
        throw new ParameterMissingInRequestError(parameterName);
    }

    return req.body[parameterName]?.trim();
};

/**
 * Ensures if user is part of the meeting conversation.
 * @param conversationData - Conversation data.
 * @param userId - Aad object id of user.
 * @throws - error if user is not part of the conversation.
 */
export const ensureUserIsPartOfMeetingConversation = async (conversationData: IConversation, userId: string): Promise<void> => {
    ensureConversationBelongsToMeetingChat(conversationData);

    if (process.env.MicrosoftAppId === undefined) {
        exceptionLogger('MicrosoftAppId missing in app settings.');
        throw new Error('MicrosoftAppId missing in app settings.');
    }

    const isUserPartOfConversation = await verifyUserFromConversationId(
        process.env.MicrosoftAppId?.toString(),
        await getMicrosoftAppPassword(),
        conversationData._id,
        conversationData.serviceUrl,
        conversationData.tenantId,
        userId
    );

    if (!isUserPartOfConversation) {
        throw new UserIsNotPartOfConversationError();
    }
};

/**
 * Get teams member id from teams member info. This is the 29:xxx ID for the user.
 * @param userAadObjectId - AAD user id.
 * @param conversationId - conversation id
 * @param serviceUrl - service url.
 */
export const getTeamsUserId = async (userAadObjectId: string, conversationId: string, serviceUrl: string) => {
    try {
        const conversation: ConversationAccount = {
            id: conversationId,
            isGroup: false,
            tenantId: '',
            name: '',
            conversationType: '',
        };
        const conversationReference: ConversationReference = {
            serviceUrl: serviceUrl,
            channelId: 'msteams',
            conversation,
            bot: {
                name: '',
                id: '',
            },
        };

        const adapter: BotFrameworkAdapter = new BotFrameworkAdapter({
            appId: process.env.MicrosoftAppId,
            appPassword: await getMicrosoftAppPassword(),
        });

        const teamMember = await getMemberInfo(userAadObjectId, adapter, conversationReference);
        if (teamMember !== undefined) {
            return teamMember.id;
        }
        throw new Error('Could not get member info for teams user');
    } catch (error) {
        exceptionLogger(error, {
            conversationId: conversationId,
            userAadObjectId: userAadObjectId,
            filename: module.id,
            exceptionName: TelemetryExceptions.GetTeamsMemberIdFailed,
        });
        throw error;
    }
};

// This function returns teams api to get member info. Added this as a separate function for better UT coverage.
export const getMemberInfo = async (userId: string, adapter: BotFrameworkAdapter, conversationReference: ConversationReference): Promise<TeamsChannelAccount> => {
    let teamMember;
    await adapter.continueConversation(conversationReference, async (context) => {
        teamMember = await TeamsInfo.getMember(context, userId);
    });
    return teamMember;
};
