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
import { UserIsNotPartOfConversationError } from 'src/errors/userIsNotPartOfConversationError';
import { ConversationDoesNotBelongToMeetingChatError } from 'src/errors/conversationDoesNotBelongToMeetingChatError';
import { Request } from 'express';
import { ParameterMissingInRequestError } from 'src/errors/parameterMissingInRequestError';
import { TelemetryExceptions } from 'src/constants/telemetryConstants';
import { qnaSessionClientDataContract } from 'src/contracts/qnaSessionClientDataContract';

/**
 * Gets questions data and user data for each active qna sessions, process them and returns an array of detailed qna sessions.
 * @param qnaSessionDataArray - Array of qna sessions data
 * @returns - qna session data array.
 */
export const processQnASesssionsDataForMeetingTab = async (
    qnaSessionDataArray: IQnASession_populated[]
): Promise<qnaSessionClientDataContract[]> => {
    let qnaSessionData: IQnASession_populated;
    const qnaSessionArrayForTab: qnaSessionClientDataContract[] = [];
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

        const hostUser = await userDataService.getUser(qnaSessionData.hostId);

        const qnaSessionDataObject: qnaSessionClientDataContract = {
            sessionId: qnaSessionData._id,
            title: qnaSessionData.title,
            isActive: qnaSessionData.isActive,
            dateTimeCreated: qnaSessionData.dateTimeCreated,
            dateTimeEnded: qnaSessionData.dateTimeEnded,
            hostUser: { id: hostUser._id, name: hostUser.userName },
            numberOfQuestions: questionData.length,
            questions: voteSortedQuestions,
            users: users,
        };
        qnaSessionArrayForTab.push(qnaSessionDataObject);
    }

    return qnaSessionArrayForTab;
};

/**
 * Checks if a given parameter is a valid string.
 * @param param - parameter.
 * @returns - true if parameter is a valid string.
 */
const isValidStringParameter = (param: string | undefined | null): boolean => {
    return param !== undefined && param !== null && param !== '';
};

/**
 * Ensures if conversation belongs to meeting chat.
 * @param conversationData - Conversation data.
 */
export const ensureConversationBelongsToMeetingChat = (
    conversationData: IConversation
) => {
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
export const getAndEnsureRequestBodyContainsParameter = (
    req: Request,
    parameterName: string
): string => {
    if (!isValidStringParameter(req.body[parameterName])) {
        throw new ParameterMissingInRequestError(parameterName);
    }

    return req.body[parameterName];
};

/**
 * Ensures if user is part of the meeting conversation.
 * @param conversationData - Conversation data.
 * @param userId - Aad object id of user.
 * @throws - error if user is not part of the conversation.
 */
export const ensureUserIsPartOfMeetingConversation = async (
    conversationData: IConversation,
    userId: string
): Promise<void> => {
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

export const patchActionForQuestion = ['upvote', 'downvote', 'markAnswered'];

/**
 * Get teams member id from teams member info. This is the 29:xxx ID for the user.
 * @param userAadObjectId - AAD user id.
 * @param conversationId - conversation id
 * @param serviceUrl - service url.
 */
export const getTeamsUserId = async (
    userAadObjectId: string,
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
            userAadObjectId,
            adapter,
            conversationReference
        );
        if (teamMember !== undefined) {
            return teamMember.id;
        }
        throw new Error('Could not get member info for teams user');
    } catch (error) {
        exceptionLogger(error, {
            conversationId: conversationId,
            userAadObjectId: userAadObjectId,
            filename: module.id,
            name: TelemetryExceptions.GetTeamsMemberIdFailed,
        });
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
