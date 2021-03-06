// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IQnASession_populated, IQuestion } from 'msteams-app-questionly.data';
import { DataEventType, IDataEvent } from 'msteams-app-questionly.common';
import { ClientDataContract } from 'src/contracts/clientDataContract';

/**
 * Creates event data payload corresponding to qnaSession created operation.
 * Updates event version in db and adds new version to the payload.
 * @param qnaSession - qnaSession document with host uder details populated.
 * @returns - data event corresponding to qnaSession created operation.
 */
export const createQnaSessionCreatedEvent = (qnaSession: IQnASession_populated): IDataEvent => {
    const qnaSessionData: ClientDataContract.QnaSession = {
        sessionId: qnaSession._id,
        title: qnaSession.title,
        description: qnaSession.description,
        isActive: qnaSession.isActive,
        hostUser: {
            id: qnaSession.hostId._id,
            name: qnaSession.hostId.userName,
        },
        dateTimeCreated: qnaSession.dateTimeCreated,
        answeredQuestions: [],
        unansweredQuestions: [],
    };

    return {
        qnaSessionId: qnaSession._id,
        type: DataEventType.qnaSessionCreatedEvent,
        data: qnaSessionData,
        //version: 0,
    };
};

/**
 * Creates event data payload corresponding to qnaSession ended operation.
 * Updates event version in db and adds new version to the payload.
 * @param qnaSessionId - qnaSession id.
 * @returns - data event corresponding to qnaSession ended operation.
 */
export const createQnaSessionEndedEvent = (qnaSessionId: string): IDataEvent => {
    const data = {
        qnaSessionId: qnaSessionId,
    };

    return {
        qnaSessionId: qnaSessionId,
        type: DataEventType.qnaSessionEndedEvent,
        data: data,
        //version: await qnaSessionDataService.incrementAndGetDataEventVersion(qnaSessionId),
    };
};

/**
 * Creates event data payload corresponding to question added to a qnaSession operation.
 * Updates event version in db and adds new version to the payload.
 * @param qnaSessionId - qnaSession id.
 * @param question - question document.
 * @param postedByUserAadObjectId - aadObject id of user who posted the question.
 * @returns - data event corresponding to qnaSession ended operation.
 */
export const createQuestionAddedEvent = (qnaSessionId: string, question: IQuestion, postedByUserAadObjectId: string): IDataEvent => {
    const data = {
        questionId: question._id,
        postedByUserAadObjectId: postedByUserAadObjectId,
    };

    return {
        qnaSessionId: qnaSessionId,
        type: DataEventType.newQuestionAddedEvent,
        data: data,
        //version: await qnaSessionDataService.incrementAndGetDataEventVersion(qnaSessionId),
    };
};

/**
 * Creates event data payload corresponding to question upvoted operation.
 * Updates event version in db and adds new version to the payload.
 * @param qnaSessionId - qnaSession id.
 * @param questionId - question id.
 * @param upvotedByUserAadObjectId - aadObject id of user who upvoted the question.
 * @returns - data event corresponding to qnaSession ended operation.
 */
export const createQuestionUpvotedEvent = (qnaSessionId: string, questionId: string, upvotedByUserAadObjectId: string): IDataEvent => {
    const data = {
        questionId: questionId,
        upvotedByUserAadObjectId: upvotedByUserAadObjectId,
    };

    return {
        qnaSessionId: qnaSessionId,
        type: DataEventType.questionUpvotedEvent,
        data: data,
        //version: await qnaSessionDataService.incrementAndGetDataEventVersion(qnaSessionId),
    };
};

/**
 * Creates event data payload corresponding to question downvoted operation.
 * Updates event version in db and adds new version to the payload.
 * @param qnaSessionId - qnaSession id.
 * @param questionId - question id.
 * @param downvotedByUserAadObjectId - aadObject id of user who downvoted the question.
 * @returns - data event corresponding to qnaSession ended operation.
 */
export const createQuestionDownvotedEvent = (qnaSessionId: string, questionId: string, downvotedByUserAadObjectId: string): IDataEvent => {
    const data = {
        questionId: questionId,
        downvotedByUserAadObjectId: downvotedByUserAadObjectId,
    };

    return {
        qnaSessionId: qnaSessionId,
        type: DataEventType.questionDownvotedEvent,
        data: data,
        //version: await qnaSessionDataService.incrementAndGetDataEventVersion(qnaSessionId),
    };
};

/**
 * Creates event data payload corresponding to question marked as answered operation.
 * Updates event version in db and adds new version to the payload
 * @param qnaSessionId - qnaSession id.
 * @param questionId - question id.
 * @param markedAnsweredByUserAadObjectId - aadObject id of user who marked the question as answered.
 * @returns - data event corresponding to qnaSession ended operation.
 */
export const createQuestionMarkedAsAnsweredEvent = (qnaSessionId: string, questionId: string, markedAnsweredByUserAadObjectId: string): IDataEvent => {
    const data = {
        questionId: questionId,
        markedAnsweredByUserAadObjectId: markedAnsweredByUserAadObjectId,
    };

    return {
        qnaSessionId: qnaSessionId,
        type: DataEventType.questionMarkedAsAnsweredEvent,
        data: data,
        //version: await qnaSessionDataService.incrementAndGetDataEventVersion(qnaSessionId),
    };
};
