import {
    IQnASession_populated,
    qnaSessionDataService,
    questionDataService,
    userDataService,
} from 'msteams-app-questionly.data';
import { MicrosoftAppCredentials } from 'botframework-connector';
import { exceptionLogger } from 'src/util/exceptionTracking';
import axios from 'axios';
import { getMicrosoftAppPassword } from 'src/util/keyvault';

export const getAllQnASesssionsDataForTab = async (conversationId: string) => {
    const qnaSessionDataArray: IQnASession_populated[] = await qnaSessionDataService.getAllQnASessionData(
        conversationId
    );

    if (qnaSessionDataArray.length === 0) {
        return qnaSessionDataArray;
    }

    let qnaSessionData: IQnASession_populated;
    const qnaSessionArrayForTab: any[] = [];
    for (let i = 0; i < qnaSessionDataArray.length; i++) {
        qnaSessionData = qnaSessionDataArray[i];
        let questionsData;
        try {
            questionsData = await questionDataService.getQuestions(
                qnaSessionData.id
            );
        } catch (err) {
            exceptionLogger(err);
            throw err;
        }
        const recentQuestions = questionsData.recentQuestions;
        const userSet = new Set();
        const users: any[] = [];
        if (recentQuestions !== undefined) {
            for (let j = 0; j < recentQuestions.length; j++) {
                if (!userSet.has(recentQuestions[j].userId._id)) {
                    users.push({
                        id: recentQuestions[j].userId._id,
                        name: recentQuestions[j].userId.userName,
                    });
                    userSet.add(recentQuestions[j].userId._id);
                }
            }
        }

        let hostUser;
        try {
            hostUser = await userDataService.getUser(qnaSessionData.hostId);
        } catch (err) {
            exceptionLogger(err);
            throw err;
        }

        const qnaSessionDataObject = {
            sessionId: qnaSessionData.id,
            title: qnaSessionData.title,
            isActive: qnaSessionData.isActive,
            dateTimeCreated: qnaSessionData.dateTimeCreated,
            dateTimeEnded: qnaSessionData.dateTimeEnded,
            hostUser: { id: hostUser.id, name: hostUser.userName },
            numberOfQuestions: questionsData.numQuestions,
            users: users,
        };
        qnaSessionArrayForTab.push(qnaSessionDataObject);
    }

    return qnaSessionArrayForTab;
};

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
    if (role === 'Organizer' || role === 'Presenter') {
        return true;
    }
    return false;
};

export const getNumberOfActiveSessions = async (conversationId: string) => {
    const qnaSessions: IQnASession_populated[] = await qnaSessionDataService.getAllQnASessionData(
        conversationId
    );
    let activeSessions = 0;
    for (let i = 0; i < qnaSessions.length; i++) {
        const qnaSession: IQnASession_populated = qnaSessions[i];
        if (qnaSession.isActive === true) {
            activeSessions++;
        }
    }
    return activeSessions;
};

const getToken = async () => {
    let MicrosoftAppId;
    if (process.env.MicrosoftAppId !== undefined) {
        MicrosoftAppId = process.env.MicrosoftAppId;
    } else {
        exceptionLogger('MicrosoftAppId missing in local settings.');
        throw new Error('MicrosoftAppId missing in local settings.');
    }
    const appPassword = await getMicrosoftAppPassword();
    const appCredentials = new MicrosoftAppCredentials(
        process.env.MicrosoftAppId,
        appPassword
    );
    const token = await appCredentials.getToken();
    return token;
};

const getParticipantRole = async (
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
        throw new Error('Error while getting participant role.');
    }

    axios
        .get(
            `${serviceUrl}v1/meetings/${meetingId}/participants/${userId}?tenantId=${tenantId}`,
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
            throw new Error('Error while getting participant role.');
        });

    return role;
};
