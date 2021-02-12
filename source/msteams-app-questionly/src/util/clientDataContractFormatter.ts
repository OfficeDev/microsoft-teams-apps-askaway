import { ClientDataContract } from 'src/contracts/clientDataContract';
import { exceptionLogger } from 'src/util/exceptionTracking';
import { IQnASession_populated, IQuestionPopulatedUser, IUser, IQuestionDataService, IUserDataService } from 'msteams-app-questionly.data';

export interface IClientDataContractFormatter {
    formatQnaSessionDataAsPerClientDataContract: (qnaSessionData: IQnASession_populated) => Promise<ClientDataContract.QnaSession>;
    formatQnaSessionDataArrayAsPerClientDataContract: (qnaSessionDataArray: IQnASession_populated[]) => Promise<ClientDataContract.QnaSession[]>;
    formatQuestionDataArrayAsPerClientDataContract: (questionDataArray: IQuestionPopulatedUser[]) => ClientDataContract.Question[];
    formatQuestionDataAsPerClientDataContract: (questionData: IQuestionPopulatedUser) => ClientDataContract.Question;
}
/**
 * Utility class that exposes methods to format data as per client contracts.
 */
export class ClientDataContractFormatter implements IClientDataContractFormatter {
    private userDataService: IUserDataService;
    private questionDataService: IQuestionDataService;

    public constructor(userDataService: IUserDataService, questionDataService: IQuestionDataService) {
        this.userDataService = userDataService;
        this.questionDataService = questionDataService;
    }

    /**
     * Formats qna session data as per client data contract.
     * @param qnaSessionData - qna session document.
     * @returns - qna session data as per client data contract.
     */
    public formatQnaSessionDataAsPerClientDataContract = async (qnaSessionData: IQnASession_populated): Promise<ClientDataContract.QnaSession> => {
        const questionData: IQuestionPopulatedUser[] = await this.questionDataService.getAllQuestions(qnaSessionData._id);

        const voteSortedQuestions: IQuestionPopulatedUser[] = questionData.sort((a, b) => {
            const diff = b.voters.length - a.voters.length;
            if (diff !== 0) return diff;
            return new Date(b.dateTimeCreated).getTime() - new Date(a.dateTimeCreated).getTime();
        });

        let hostUser: IUser;
        try {
            hostUser = await this.userDataService.getUser(qnaSessionData.hostId);
        } catch (err) {
            exceptionLogger(err);
            throw err;
        }

        return {
            sessionId: qnaSessionData._id,
            description: qnaSessionData.description,
            title: qnaSessionData.title,
            isActive: qnaSessionData.isActive,
            dateTimeCreated: qnaSessionData.dateTimeCreated,
            dateTimeEnded: qnaSessionData.dateTimeEnded,
            hostUser: { id: hostUser._id, name: hostUser.userName },
            answeredQuestions: this.formatQuestionDataArrayAsPerClientDataContract(voteSortedQuestions.filter((question) => question.isAnswered)),
            unansweredQuestions: this.formatQuestionDataArrayAsPerClientDataContract(voteSortedQuestions.filter((question) => !question.isAnswered)),
        };
    };

    /**
     * Formats qna session data array as per client data contract.
     * @param qnaSessionData - qna session document array.
     * @returns - qna session data array as per client data contract.
     */
    public formatQnaSessionDataArrayAsPerClientDataContract = async (qnaSessionDataArray: IQnASession_populated[]): Promise<ClientDataContract.QnaSession[]> => {
        return await Promise.all(qnaSessionDataArray.map(async (qnaSessionData) => await this.formatQnaSessionDataAsPerClientDataContract(qnaSessionData)));
    };

    /**
     * Formats question data array as per client data contract.
     * @param questionDataArray - question document array.
     * @returns - question data array as per client data contract.
     */
    public formatQuestionDataArrayAsPerClientDataContract = (questionDataArray: IQuestionPopulatedUser[]): ClientDataContract.Question[] => {
        return questionDataArray.map((questionData) => this.formatQuestionDataAsPerClientDataContract(questionData));
    };

    /**
     * Formats question data as per client data contract.
     * @param questionData - question document.
     * @returns - question data as per client data contract.
     */
    public formatQuestionDataAsPerClientDataContract = (questionData: IQuestionPopulatedUser): ClientDataContract.Question => {
        return {
            id: questionData._id,
            sessionId: questionData.qnaSessionId,
            content: questionData.content,
            dateTimeCreated: questionData.dateTimeCreated,
            isAnswered: questionData.isAnswered.valueOf(),
            author: {
                id: questionData.userId._id,
                name: questionData.userId.userName,
            },
            votesCount: questionData.voters.length,
            voterAadObjectIds: questionData.voters,
        };
    };
}
