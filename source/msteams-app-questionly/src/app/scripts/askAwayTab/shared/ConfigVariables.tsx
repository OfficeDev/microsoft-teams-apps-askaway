// tslint:disable-next-line:export-name
export const getBaseUrl = (): string => {
    return window.location.origin + '/api';
};

// [Constant Values]
export const CONST = Object.freeze({
    TAB_QUESTIONS: {
        PENDING: 'pendingQuestions',
        ANSWERED: 'answeredQuestions',
        ACTIVE_INDEX: 0,
    },
});
