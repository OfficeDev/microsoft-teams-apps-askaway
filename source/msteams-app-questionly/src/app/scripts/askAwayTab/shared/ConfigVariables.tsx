// tslint:disable-next-line:export-name
export const getBaseUrl = (): string => {
    return window.location.origin + '/api';
};

// [Constant Values]
export const CONST = Object.freeze({
    TAB_QUESTIONS: {
        PENDING: 'Pending questions',
        ANSWERED: 'Answered questions',
        ANSWERED_Q: 'answeredQuestions',
        UNANSWERED_Q: 'unansweredQuestions',
        UP_VOTE: 'upvote',
        DOWN_VOTE: 'downvote',
        MARK_ANSWERED: 'markAnswered',
    },
});
