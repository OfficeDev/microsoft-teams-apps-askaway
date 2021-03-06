// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IBackgroundJobPayload, IDataEvent } from 'msteams-app-questionly.common';
import axios, { AxiosRequestConfig } from 'axios';
import { exceptionLogger, getOperationIdForCurrentRequest, trackBackgroundFunctionTriggerEvent } from 'src/util/exceptionTracking';
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
import { TelemetryExceptions } from 'src/constants/telemetryConstants';
import { getFromMemoryCache, putIntoMemoryCache } from 'src/util/memoryCache';
import { getAccessToken } from 'src/util/azureCredentialUtility';
import { EventInitiator } from 'src/enums/eventInitiator';

const axiosConfig: AxiosRequestConfig = axios.defaults;
let backgroundJobUri: string;

const accessTokenName = 'AccessToken';
const oneMinuteToMs = 60000;

// Load background job uri and function key in memory.
// throws exception if these values failed to load.
export const initBackgroundJobSetup = async () => {
    if (process.env.BackgroundJobUri === undefined) {
        exceptionLogger('backgroundJobUri is missing in app settings.');
        throw new Error('backgroundJobUri is missing in app settings.');
    }

    backgroundJobUri = process.env.BackgroundJobUri;
};

/**
 * Triggers background job for new qnaSession created event.
 * @param session - Newly created qnaSession document.
 * @param serviceUrl - bot service url.
 * @param initiator - event initiator (main card/ rest api)
 * @param meetingId - meeting id.
 * @returns - true if background job is successfully triggered/ false otherwise.
 */
export const triggerBackgroundJobForQnaSessionCreatedEvent = async (session: IQnASession_populated, serviceUrl: string, initiator: EventInitiator, meetingId?: string): Promise<boolean> => {
    const eventData = createQnaSessionCreatedEvent(session);
    return await triggerBackgroundJob(session.conversationId, session._id, eventData, serviceUrl, initiator, meetingId);
};

/**
 * Triggers background job for qnaSession ended event.
 * @param conversationId - conversation id.
 * @param qnaSessionId - qnaSession id.
 * @param serviceUrl - bot service url.
 * @param initiator - event initiator (main card/ rest api)
 * @param meetingId - meeting id.
 * @returns - true if background job is successfully triggered/ false otherwise.
 */
export const triggerBackgroundJobForQnaSessionEndedEvent = async (
    conversationId: string,
    qnaSessionId: string,
    serviceUrl: string,
    initiator: EventInitiator,
    meetingId?: string
): Promise<boolean> => {
    const eventData = createQnaSessionEndedEvent(qnaSessionId);
    return await triggerBackgroundJob(conversationId, qnaSessionId, eventData, serviceUrl, initiator, meetingId);
};

/**
 * Triggers background job for question upvoted event.
 * @param conversationId - conversation id.
 * @param questionId - question id.
 * @param qnaSessionId - qnaSession id.
 * @param upvotedByUserId - AadObject id of user who upvoted the question.
 * @param serviceUrl - bot service url.
 * @param initiator - event initiator (main card/ rest api)
 * @param meetingId - meeting id.
 * @returns - true if background job is successfully triggered/ false otherwise.
 */
export const triggerBackgroundJobForQuestionUpvotedEvent = async (
    conversationId: string,
    questionId: string,
    qnaSessionId: string,
    upvotedByUserId: string,
    serviceUrl: string,
    initiator: EventInitiator,
    meetingId?: string
): Promise<boolean> => {
    const eventData = createQuestionUpvotedEvent(qnaSessionId, questionId, upvotedByUserId);
    return await triggerBackgroundJob(conversationId, qnaSessionId, eventData, serviceUrl, initiator, meetingId);
};

/**
 * Triggers background job for question downvoted event.
 * @param conversationId - conversation id.
 * @param questionId - question id.
 * @param qnaSessionId - qnaSession id.
 * @param downvotedByUserId - AadObject id of user who downvoted the question.
 * @param serviceUrl - bot service url.
 * @param initiator - event initiator (main card/ rest api)
 * @param meetingId - meeting id.
 * @returns - true if background job is successfully triggered/ false otherwise.
 */
export const triggerBackgroundJobForQuestionDownvotedEvent = async (
    conversationId: string,
    questionId: string,
    qnaSessionId: string,
    downvotedByUserId: string,
    serviceUrl: string,
    initiator: EventInitiator,
    meetingId?: string
): Promise<boolean> => {
    const eventData = createQuestionDownvotedEvent(qnaSessionId, questionId, downvotedByUserId);
    return await triggerBackgroundJob(conversationId, qnaSessionId, eventData, serviceUrl, initiator, meetingId);
};

/**
 * Triggers background job for question posted event.
 * @param conversationId - conversation id.
 * @param question - question document.
 * @param qnaSessionId - qnaSession id.
 * @param postedByUserId - AadObject id of user who posted the question.
 * @param serviceUrl - bot service url.
 * @param initiator - event initiator (main card/ rest api)
 * @param meetingId - meeting id.
 * @returns - true if background job is successfully triggered/ false otherwise.
 */
export const triggerBackgroundJobForQuestionPostedEvent = async (
    conversationId: string,
    question: IQuestion,
    qnaSessionId: string,
    postedByUserId: string,
    serviceUrl: string,
    initiator: EventInitiator,
    meetingId?: string
): Promise<boolean> => {
    const eventData = createQuestionAddedEvent(qnaSessionId, question, postedByUserId);
    return await triggerBackgroundJob(conversationId, qnaSessionId, eventData, serviceUrl, initiator, meetingId);
};

/**
 * Triggers background job for question marked as answered event.
 * @param conversationId - conversation id.
 * @param questionId - question id.
 * @param qnaSessionId - qnaSession id.
 * @param markedAnsweredByUserAadObjectId - AadObject id of user who marked the question as answered.
 * @param serviceUrl - bot service url.
 * @param initiator - event initiator (main card/ rest api)
 * @param meetingId - meeting id.
 * @returns - true if background job is successfully triggered/ false otherwise.
 */
export const triggerBackgroundJobForQuestionMarkedAsAnsweredEvent = async (
    conversationId: string,
    questionId: string,
    qnaSessionId: string,
    markedAnsweredByUserAadObjectId: string,
    serviceUrl: string,
    initiator: EventInitiator,
    meetingId?: string
): Promise<boolean> => {
    const eventData = createQuestionMarkedAsAnsweredEvent(qnaSessionId, questionId, markedAnsweredByUserAadObjectId);
    return await triggerBackgroundJob(conversationId, qnaSessionId, eventData, serviceUrl, initiator, meetingId);
};

/**
 * Triggers background job with appropriate params. This function eats up all the exception and logs them.
 * @param conversationId - conversation id.
 * @param qnaSessionId - qnaSession id.
 * @param dataEvent - data event for clients to update UX real time.
 * @param serviceUrl - bot service url.
 * @param initiator - event initiator (main card/ rest api)
 * @param meetingId - meeting id.
 * @returns - true if background job is successfully triggered/ false otherwise.
 */
const triggerBackgroundJob = async (conversationId: string, qnaSessionId: string, dataEvent: IDataEvent, serviceUrl: string, initiator: EventInitiator, meetingId?: string): Promise<boolean> => {
    const backgroundJobPayload: IBackgroundJobPayload = {
        conversationId: conversationId,
        qnaSessionId: qnaSessionId,
        eventData: dataEvent,
        operationId: getOperationIdForCurrentRequest(),
        serviceUrl: serviceUrl,
        meetingId: meetingId,
    };

    try {
        const token = await getToken();
        axiosConfig.headers['Authorization'] = `Bearer ${token}`;

        const res = await axios.post(backgroundJobUri, backgroundJobPayload, axiosConfig);
        if (res.status != StatusCodes.ACCEPTED) {
            throw new Error(`Error in scheduling background job for conversation id ${conversationId}. returned status: ${res.status}, data: ${res.data}`);
        }

        // Track background function triggers.
        trackBackgroundFunctionTriggerEvent({
            qnaSessionId: qnaSessionId,
            meetingId: meetingId,
            conversationId: conversationId,
            properties: {
                event: dataEvent,
                caller: initiator,
            },
        });

        return true;
    } catch (error) {
        exceptionLogger(error, {
            conversationId: conversationId,
            qnaSessionId: qnaSessionId,
            filename: module.id,
            exceptionName: TelemetryExceptions.TriggerBackgroundJobFailed,
        });

        return false;
    }
};

/**
 * Gets JWT access token from memory cache, if present and not expired.
 * Otherwise, calls getToken using DefaultAzureCredential to get a new access token.
 * @returns access token.
 * @throws error if access token could not be fetched.
 */
const getToken = async (): Promise<string> => {
    if (process.env.debugMode === 'true') {
        return '';
    }
    let token = getFromMemoryCache(accessTokenName);
    if (token) {
        return token;
    }
    const accessToken = await getAccessToken();
    if (!accessToken) {
        throw new Error('Error while fetching access token for background job.');
    }
    token = accessToken.token;

    const currentTimestamp = new Date().getTime();
    const expiresAfterMs = accessToken.expiresOnTimestamp - currentTimestamp - oneMinuteToMs;
    if (expiresAfterMs > 0) {
        putIntoMemoryCache(accessTokenName, token, expiresAfterMs);
    }

    return token;
};
