export interface HostUser {
    id: string;
    name: string;
}

export interface QuestionProps {
    id: string;
    sesionId: string;
    dateTimeCreated: string;
    isAnswered: boolean;
    votesCount: number;
    author: {
        id: string;
        name: string;
    };
    content: string;
    voterAadObjectIds: Array<string>;
}
export interface ActiveSessionData {
    sessionId: string;
    title: string;
    isActive: boolean;
    dateTimeCreated: string;
    hostUser: HostUser;
    answeredQuestions: Array<QuestionProps>;
    unansweredQuestions: Array<QuestionProps>;
}
