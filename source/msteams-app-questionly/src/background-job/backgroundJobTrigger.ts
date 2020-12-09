import { IBackgroundJobPayload } from 'src/background-job/backgroundJobPayload';
import { IDataEvent } from 'msteams-app-questionly.common';
import axios, { AxiosRequestConfig } from 'axios';
import { exceptionLogger } from 'src/util/exceptionTracking';
import { getBackgroundFunctionKey } from 'src/util/keyvault';
import { IQnASession_populated, IQuestion } from 'msteams-app-questionly.data';
import {
    createQnaSessionCreatedEvent,
    createQnaSessionEndedEvent,
    createQuestionAddedEvent,
    createQuestionDownvotedEvent,
    createQuestionMarkedAsAnsweredEvent,
    createQuestionUpvotedEvent,
} from 'src/background-job/events/dataEventUtility';
import { StatusCodes } from 'http-status-codes';

const axiosConfig: AxiosRequestConfig = axios.defaults;
let backgroundJobUri: string;

// Load background job uri and function key in memory.
// throws exception if these values failed to load.
export const initBackgroundJobSetup = async () => {
    axiosConfig.headers['x-functions-key'] = await getBackgroundFunctionKey();

    if (process.env.BackgroundJobUri === undefined) {
        exceptionLogger('backgroundJobUri is missing in app settings.');
        throw new Error('backgroundJobUri is missing in app settings.');
    }

    backgroundJobUri = process.env.BackgroundJobUri;
};

/**
 * Triggers background job for new qnaSession created event.
 * @param session - Newly created qnaSession document.
 */
export const triggerBackgroundJobForQnaSessionCreatedEvent = async (
    session: IQnASession_populated
): Promise<void> => {
    const eventData = createQnaSessionCreatedEvent(session);
    await triggerBackgroundJob(session.conversationId, session._id, eventData);
};

/**
 * Triggers background job for qnaSession ended event.
 * @param conversationId - conversation id.
 * @param qnaSessionId - qnaSession id.
 * @param endedByUserAadObjectId - AadObject id of user who ended the session.
 */
export const triggerBackgroundJobForQnaSessionEndedEvent = async (
    conversationId: string,
    qnaSessionId: string,
    endedByUserId: string
) => {
    const eventData = await createQnaSessionEndedEvent(
        qnaSessionId,
        endedByUserId
    );
    await triggerBackgroundJob(conversationId, qnaSessionId, eventData);
};

/**
 * Triggers background job for question upvoted event.
 * @param conversationId - conversation id.
 * @param questionId - question id.
 * @param qnaSessionId - qnaSession id.
 * @param upvotedByUserId - AadObject id of user who upvoted the question.
 */
export const triggerBackgroundJobForQuestionUpvotedEvent = async (
    conversationId: string,
    questionId: string,
    qnaSessionId: string,
    upvotedByUserId: string
) => {
    const eventData = await createQuestionUpvotedEvent(
        qnaSessionId,
        questionId,
        upvotedByUserId
    );
    await triggerBackgroundJob(conversationId, qnaSessionId, eventData);
};

/**
 * Triggers background job for question downvoted event.
 * @param conversationId - conversation id.
 * @param questionId - question id.
 * @param qnaSessionId - qnaSession id.
 * @param downvotedByUserId - AadObject id of user who downvoted the question.
 */
export const triggerBackgroundJobForQuestionDownvotedEvent = async (
    conversationId: string,
    questionId: string,
    qnaSessionId: string,
    downvotedByUserId: string
) => {
    const eventData = await createQuestionDownvotedEvent(
        qnaSessionId,
        questionId,
        downvotedByUserId
    );
    await triggerBackgroundJob(conversationId, qnaSessionId, eventData);
};

/**
 * Triggers background job for question posted event.
 * @param conversationId - conversation id.
 * @param question - question document.
 * @param qnaSessionId - qnaSession id.
 * @param postedByUserId - AadObject id of user who posted the question.
 */
export const triggerBackgroundJobForQuestionPostedEvent = async (
    conversationId: string,
    question: IQuestion,
    qnaSessionId: string,
    postedByUserId: string
) => {
    const eventData = await createQuestionAddedEvent(
        qnaSessionId,
        question,
        postedByUserId
    );
    await triggerBackgroundJob(conversationId, qnaSessionId, eventData);
};

/**
 * Triggers background job for question marked as answered event.
 * @param conversationId - conversation id.
 * @param questionId - question id.
 * @param qnaSessionId - qnaSession id.
 * @param markedAnsweredByUserAadObjectId - AadObject id of user who marked the question as answered.
 */
export const triggerBackgroundJobForQuestionMarkedAsAnsweredEvent = async (
    conversationId: string,
    questionId: string,
    qnaSessionId: string,
    markedAnsweredByUserAadObjectId: string
) => {
    const eventData = await createQuestionMarkedAsAnsweredEvent(
        qnaSessionId,
        questionId,
        markedAnsweredByUserAadObjectId
    );
    await triggerBackgroundJob(conversationId, qnaSessionId, eventData);
};

/**
 * Triggers background job with appropriate params. This function eats up all the exception and logs them.
 * @param conversationId - conversation id.
 * @param qnaSessionId - qnaSession id.
 * @param dataEvent - data event for clients to update UX real time.
 */
const triggerBackgroundJob = async (
    conversationId: string,
    qnaSessionId: string,
    dataEvent: IDataEvent
): Promise<void> => {
    const backgroundJobPayload: IBackgroundJobPayload = {
        conversationId: conversationId,
        qnaSessionId: qnaSessionId,
        eventData: dataEvent,
    };

    try {
        const res = await axios.post(
            backgroundJobUri,
            backgroundJobPayload,
            axiosConfig
        );

        if (res.status != StatusCodes.ACCEPTED) {
            throw new Error(
                `Error in scheduling background job for conversation id ${conversationId}. returned status: ${res.status}, data: ${res.data}`
            );
        }
    } catch (error) {
        exceptionLogger(error);
    }
};
