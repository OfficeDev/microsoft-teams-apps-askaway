export interface HostUser {
    id: string;
    name: string;
}
export interface ActiveSessionData {
    sessionId: string;
    title: string;
    isActive: boolean;
    dateTimeCreated: string;
    hostUser: HostUser;
    answeredQuestions: Array<string>;
    unansweredQuestions: Array<string>;
}
