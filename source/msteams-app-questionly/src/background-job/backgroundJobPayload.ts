import { IDataEvent } from 'msteams-app-questionly.common';

/**
 * Payload type for background jobs.
 */
export interface IBackgroundJobPayload {
    /**
     * Conversation id
     */
    conversationId: string;

    /**
     * Q&A session id
     */
    qnaSessionId: string;

    /**
     * Data needed by clients for UX refresh.
     */
    eventData: IDataEvent;

    /**
     * Operation id for telemetry client.
     */
    operationId: string;
}
