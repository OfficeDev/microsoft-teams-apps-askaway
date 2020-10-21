import { IQnASession_populated } from 'src/Data/Schemas/QnASession';
import { IUser, User } from 'src/Data/Schemas/user';
import { qnaSessionDataService } from 'src/data/services/qnaSessionDataService';
import { questionDataService } from 'src/data/services/questionDataService';
import { exceptionLogger } from 'src/util/ExceptionTracking';
import { retryWrapper } from 'src/util/RetryPolicies';

export const getAllQnASesssionsDataForTab = async (conversationId: string) => {
    const qnaSessionDataArray: IQnASession_populated[] = await qnaSessionDataService.getAllQnASessionData(
        conversationId
    );

    if (qnaSessionDataArray.length === 0) return [];

    let qnaSessionData: IQnASession_populated;
    const qnaSessionArrayForTab = new Array();
    for (let i = 0; i < qnaSessionDataArray.length; i++) {
        qnaSessionData = qnaSessionDataArray[i];
        let questionsData;
        try {
            questionsData = await questionDataService.getQuestions(
                qnaSessionData.id
            );
        } catch (err) {
            exceptionLogger(err.message);
            throw err;
        }
        const recentQuestions = questionsData.recentQuestions;
        const userSet = new Set();
        const users = new Array();
        if (recentQuestions !== undefined) {
            for (let j = 0; j < recentQuestions.length; j++) {
                if (!userSet.has(recentQuestions[j].userId._id)) {
                    users.push({
                        id: recentQuestions[j].userId._id,
                        name: recentQuestions[j].userId.userName,
                    });
                    userSet.add(recentQuestions[j].userId._id);
                }
            }
        }

        const hostUser: IUser = await retryWrapper<IUser>(() =>
            User.findById(qnaSessionData.hostId)
        );
        const qnaSessionDataObject = {
            sessionId: qnaSessionData.id,
            title: qnaSessionData.title,
            isActive: qnaSessionData.isActive,
            dateTimeCreated: qnaSessionData.dateTimeCreated,
            dateTimeEnded: qnaSessionData.dateTimeEnded,
            hostUser: { id: hostUser.id, name: hostUser.userName },
            numberOfQuestions: questionsData.numQuestions,
            users: users,
        };
        qnaSessionArrayForTab.push(qnaSessionDataObject);
    }

    return qnaSessionArrayForTab;
};
