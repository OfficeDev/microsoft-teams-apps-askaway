import { IQnASession_populated } from 'src/data/schemas/qnaSession';
import { qnaSessionDataService } from 'src/data/services/qnaSessionDataService';
import { questionDataService } from 'src/data/services/questionDataService';
import { userDataService } from 'src/data/services/userDataService';
import { exceptionLogger } from 'src/util/exceptionTracking';

export const getAllQnASesssionsDataForTab = async (conversationId: string) => {
    const qnaSessionDataArray: IQnASession_populated[] = await qnaSessionDataService.getAllQnASessionData(
        conversationId
    );

    if (qnaSessionDataArray.length === 0) {
        return qnaSessionDataArray;
    }

    let qnaSessionData: IQnASession_populated;
    const qnaSessionArrayForTab: any[] = [];
    for (let i = 0; i < qnaSessionDataArray.length; i++) {
        qnaSessionData = qnaSessionDataArray[i];
        let questionsData;
        try {
            questionsData = await questionDataService.getQuestions(
                qnaSessionData.id
            );
        } catch (err) {
            exceptionLogger(err);
            throw err;
        }
        const recentQuestions = questionsData.recentQuestions;
        const userSet = new Set();
        const users: any[] = [];
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

        let hostUser;
        try {
            hostUser = await userDataService.getUser(qnaSessionData.hostId);
        } catch (err) {
            exceptionLogger(err);
            throw err;
        }

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
