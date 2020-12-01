import axios from 'axios';
import { MicrosoftAppCredentials } from 'botframework-connector';
import { organizer, presenter } from 'src/constants/restConstants';
import { exceptionLogger } from './exceptionTracking';
import { getMicrosoftAppPassword } from './keyvault';

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
    if (role === organizer || role === presenter) {
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
    let token;
    let role;
    try {
        token = await getToken();
    } catch (error) {
        exceptionLogger(error);
        throw new Error('Error while getting participant role.');
    }

    await axios
        .get(
            `${serviceUrl}/v1/meetings/${meetingId}/participants/${userId}?tenantId=${tenantId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )
        .then((res) => {
            role = res.data.meeting.role;
        })
        .catch((error) => {
            exceptionLogger(error);
            throw new Error('Error while getting participant role.');
        });

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
    const token = await appCredentials.getToken();
    return token;
};
