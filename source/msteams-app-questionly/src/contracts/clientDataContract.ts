// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ClientDataContract {
    /**
     * Contract for qnasesssion data for rest api (/sessions, /activesessions) response and event data (qnaSessionCreatedEvent).
     */
    export interface QnaSession {
        /**
         * Session id.
         */
        sessionId: string;

        /**
         * Session title.
         */
        title: string;

        /**
         * Session description.
         */
        description: string;

        /**
         * Boolean denoting if session is active.
         */
        isActive: boolean;

        /**
         * host user data.
         */
        hostUser: { id: string; name: string };

        /**
         * Date time when the session was created.
         */
        dateTimeCreated: Date;

        /**
         * Data for answered questions that are asked for the session.
         */
        answeredQuestions: Question[];

        /**
         * Data for unanswered questions that are asked for the session.
         */
        unansweredQuestions: Question[];

        /**
         * Date time when the session was ended.
         */
        dateTimeEnded?: Date;
    }

    /**
     * Contract for question data for rest api response.
     */
    export interface Question {
        /**
         * Question id.
         */
        id: string;

        /**
         * Session id.
         */
        sessionId: string;

        /**
         * Question content.
         */
        content: string;

        /**
         * Date time when the question was created.
         */
        dateTimeCreated: Date;

        /**
         * Boolean denoting if question is answered.
         */
        isAnswered: boolean;

        /**
         * Details of user who created the question.
         */
        author: { id: string; name: string };

        /**
         * Number upvotes on the question.
         */
        votesCount: number;

        /**
         * List of aad object ids of users who upvoted the question.
         */
        voterAadObjectIds: string[];
    }

    /**
     * Contract for error response for rest api errors.
     */
    export interface errorResponse {
        /**
         * Error message.
         */
        message: string;

        /**
         * Error code.
         */
        code?: string;
    }

    /**
     * Contract for user data for rest api response (/me)
     */
    export interface User {
        /**
         * User role in the meeting
         */
        userRole: string;

        /**
         * User name
         */
        userName: string;

        /**
         * User Id
         */
        userId: string;
    }
}
