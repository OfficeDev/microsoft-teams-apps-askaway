import {
    IConversation,
    IQnASession_populated,
    IQuestionPopulatedUser,
    questionDataService,
    userDataService,
} from 'msteams-app-questionly.data';
import { exceptionLogger } from 'src/util/exceptionTracking';
import { getMicrosoftAppPassword } from 'src/util/keyvault';
import {
    BotFrameworkAdapter,
    ConversationAccount,
    ConversationReference,
    TeamsChannelAccount,
    TeamsInfo,
} from 'botbuilder';
import { verifyUserFromConversationId } from 'msteams-app-questionly.common';
import { Response } from 'express';

/**
 * Gets questions data and user data for each active qna sessions, process them and returns an array of detailed qna sessions.
 * @param qnaSessionDataArray - Array of qna sessions data
 */
export const processQnASesssionsDataForMeetingTab = async (
    qnaSessionDataArray: IQnASession_populated[]
) => {
    let qnaSessionData: IQnASession_populated;
    const qnaSessionArrayForTab: any[] = [];
    for (let i = 0; i < qnaSessionDataArray.length; i++) {
        qnaSessionData = qnaSessionDataArray[i];

        const questionData: IQuestionPopulatedUser[] = await questionDataService.getQuestionData(
            qnaSessionData._id
        );

        const voteSortedQuestions: IQuestionPopulatedUser[] = questionData.sort(
            (a, b) => {
                const diff = b.voters.length - a.voters.length;
                if (diff !== 0) return diff;
                return (
                    new Date(b.dateTimeCreated).getTime() -
                    new Date(a.dateTimeCreated).getTime()
                );
            }
        );

        const userSet = new Set();
        const users: any[] = [];
        if (questionData !== undefined) {
            for (let j = 0; j < questionData.length; j++) {
                if (!userSet.has(questionData[j].userId._id)) {
                    users.push({
                        id: questionData[j].userId._id,
                        name: questionData[j].userId.userName,
                    });
                    userSet.add(questionData[j].userId._id);
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
            numberOfQuestions: questionData.length,
            questions: voteSortedQuestions,
            users: users,
        };
        qnaSessionArrayForTab.push(qnaSessionDataObject);
    }

    return qnaSessionArrayForTab;
};

/**
 * Ensures if user is part of the conversation, if not sends `403` response back.
 * @param res - Response.
 * @param conversationData - Conversation data.
 * @param userId - Aad object id of user.
 */
export const ensureUserIsPartOfConversation = async (
    res: Response,
    conversationData: IConversation,
    userId: string
): Promise<boolean> => {
    if (process.env.MicrosoftAppId === undefined) {
        exceptionLogger('MicrosoftAppId missing in app settings.');
        throw new Error('MicrosoftAppId missing in app settings.');
    }

    const isUserPartOfConversation = await verifyUserFromConversationId(
        process.env.MicrosoftAppId?.toString(),
        await getMicrosoftAppPassword(),
        conversationData.id,
        conversationData.serviceUrl,
        conversationData.tenantId,
        userId
    );

    if (!isUserPartOfConversation) {
        formResponseWhenUserIsNotPartOfConversation(res);
    }

    return isUserPartOfConversation;
};

export const patchActionForQuestion = ['upvote', 'downvote', 'markAnswered'];

export const formResponseWhenUserIsNotPartOfConversation = (res) => {
    res.statusCode = 403;
    res.send(`user is not part of the given conversationId`);
};

export const getHostUserId = async (
    userId: string,
    conversationId: string,
    serviceUrl: string
) => {
    try {
        const conversationReference = {
            serviceUrl: serviceUrl,
            channelId: 'msteams',
            conversation: {
                id: conversationId,
            } as ConversationAccount,
        } as ConversationReference;

        const adapter: BotFrameworkAdapter = new BotFrameworkAdapter({
            appId: process.env.MicrosoftAppId,
            appPassword: await getMicrosoftAppPassword(),
        });

        const teamMember = await getMemberInfo(
            userId,
            adapter,
            conversationReference
        );
        if (teamMember !== undefined) {
            return teamMember.id;
        }
        throw new Error('Could not get member info for teams user');
    } catch (error) {
        exceptionLogger(error);
        throw error;
    }
};

// This function returns teams api to get member info. Added this as a separate function for better UT coverage.
export const getMemberInfo = async (
    userId: string,
    adapter: BotFrameworkAdapter,
    conversationReference: ConversationReference
): Promise<TeamsChannelAccount> => {
    let teamMember;
    await adapter.continueConversation(
        conversationReference,
        async (context) => {
            teamMember = await TeamsInfo.getMember(context, userId);
        }
    );
    return teamMember;
};
