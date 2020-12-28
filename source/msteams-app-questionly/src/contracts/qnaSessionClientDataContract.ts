import { IQuestionPopulatedUser } from 'msteams-app-questionly.data';

/**
 * Contract for qnasesssion data for rest api (/sessions, /activesessions) response and event data (qnaSessionCreatedEvent).
 */
export interface qnaSessionClientDataContract {
    /**
     * Session id.
     */
    sessionId: string;

    /**
     * Session title.
     */
    title: string;

    /**
     * Boolean denoting if session is active.
     */
    isActive: boolean;

    /**
     * host user data.
     */
    hostUser: { id: string; name: string };

    /**
     * Number of questions asked for the session.
     */
    numberOfQuestions: number;

    /**
     * Data for users who asked questions for the session.
     */
    users: { id: string; name: string }[];

    /**
     * Date time when the session was created.
     */
    dateTimeCreated: Date;

    /**
     * Data for questions that are asked for the session.
     */
    questions: IQuestionPopulatedUser[];

    /**
     * Date time when the session was ended.
     */
    dateTimeEnded?: Date;
}
