import { ClientDataContract } from 'src/contracts/clientDataContract';
import { exceptionLogger } from 'src/util/exceptionTracking';
import { IQnASession_populated, IQuestionPopulatedUser, IUser, questionDataService, userDataService } from 'msteams-app-questionly.data';

/**
 * Formats qna session data as per client data contract.
 * @param qnaSessionData - qna session document.
 * @returns - qna session data as per client data contract.
 */
export const formatQnaSessionDataAsPerClientDataContract = async (qnaSessionData: IQnASession_populated): Promise<ClientDataContract.QnaSession> => {
    const questionData: IQuestionPopulatedUser[] = await questionDataService.getQuestionData(qnaSessionData._id);

    const voteSortedQuestions: IQuestionPopulatedUser[] = questionData.sort((a, b) => {
        const diff = b.voters.length - a.voters.length;
        if (diff !== 0) return diff;
        return new Date(b.dateTimeCreated).getTime() - new Date(a.dateTimeCreated).getTime();
    });

    let hostUser: IUser;
    try {
        hostUser = await userDataService.getUser(qnaSessionData.hostId);
    } catch (err) {
        exceptionLogger(err);
        throw err;
    }

    return {
        sessionId: qnaSessionData._id,
        title: qnaSessionData.title,
        isActive: qnaSessionData.isActive,
        dateTimeCreated: qnaSessionData.dateTimeCreated,
        dateTimeEnded: qnaSessionData.dateTimeEnded,
        hostUser: { id: hostUser._id, name: hostUser.userName },
        answeredQuestions: formatQuestionDataArrayAsPerClientDataContract(voteSortedQuestions.filter((question) => question.isAnswered)),
        unansweredQuestions: formatQuestionDataArrayAsPerClientDataContract(voteSortedQuestions.filter((question) => !question.isAnswered)),
    };
};

/**
 * Formats qna session data array as per client data contract.
 * @param qnaSessionData - qna session document array.
 * @returns - qna session data array as per client data contract.
 */
export const formatQnaSessionDataArrayAsPerClientDataContract = async (qnaSessionDataArray: IQnASession_populated[]): Promise<ClientDataContract.QnaSession[]> => {
    return await Promise.all(qnaSessionDataArray.map(async (qnaSessionData) => await formatQnaSessionDataAsPerClientDataContract(qnaSessionData)));
};

/**
 * Formats question data array as per client data contract.
 * @param questionDataArray - question document array.
 * @returns - question data array as per client data contract.
 */
export const formatQuestionDataArrayAsPerClientDataContract = (questionDataArray: IQuestionPopulatedUser[]): ClientDataContract.Question[] => {
    return questionDataArray.map((questionData) => formatQuestionDataAsPerClientDataContract(questionData));
};

/**
 * Formats question data as per client data contract.
 * @param questionData - question document.
 * @returns - question data as per client data contract.
 */
export const formatQuestionDataAsPerClientDataContract = (questionData: IQuestionPopulatedUser): ClientDataContract.Question => {
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
