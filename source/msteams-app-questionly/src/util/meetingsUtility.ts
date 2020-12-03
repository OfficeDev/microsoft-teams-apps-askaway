import axios from 'axios';
import { TurnContext } from 'botbuilder';
import { MicrosoftAppCredentials } from 'botframework-connector';
import { ConversationType } from 'src/enums/ConversationType';
import { ParticipantRoles } from 'src/enums/ParticipantRoles';
import { exceptionLogger } from 'src/util/exceptionTracking';
import { getMicrosoftAppPassword } from 'src/util/keyvault';

export const isPresenterOrOrganizer = async (
    meetingId: string,
    userId: string,
    tenantId: string,
    serviceUrl: string
): Promise<boolean> => {
    const role = await getParticipantRole(
        meetingId,
        userId,
        tenantId,
        serviceUrl
    );

    if (
        role === ParticipantRoles.Organizer ||
        role === ParticipantRoles.Presenter
    ) {
        return true;
    }
    return false;
};

export const getParticipantRole = async (
    meetingId: string,
    userId: string,
    tenantId: string,
    serviceUrl: string
) => {
    let token: string;
    let role: string;

    try {
        token = await getToken();
        const result = await axios.get(
            `${serviceUrl}/v1/meetings/${meetingId}/participants/${userId}?tenantId=${tenantId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        role = result.data.meeting.role;
    } catch (error) {
        exceptionLogger(error);
        throw new Error('Error while getting participant role.');
    }

    return role;
};

const getToken = async () => {
    let appId;
    if (process.env.MicrosoftAppId !== undefined) {
        appId = process.env.MicrosoftAppId;
    } else {
        exceptionLogger('MicrosoftAppId missing in app settings.');
        throw new Error('MicrosoftAppId missing in app settings.');
    }
    const appPassword = await getMicrosoftAppPassword();
    const appCredentials = new MicrosoftAppCredentials(appId, appPassword);
    return await appCredentials.getToken();
};

/**
 * Get meeting id from turn context.
 * Returns meeting id for meeting, otherwise returns empty string.
 * @param context - turn context
 */
export const getMeetingIdFromContext = async (context: TurnContext) => {
    const conversation = context.activity.conversation;
    const isChannel =
        conversation.conversationType === ConversationType.Channel;
    if (!isChannel) {
        return context.activity.channelData?.meeting?.id;
    }
    return '';
};
