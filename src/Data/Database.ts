import * as mongoose from 'mongoose';
import {
    QnASession,
    IQnASession_populated,
    IQnASession,
} from 'src/Data/Schemas/QnASession';
import { User } from 'src/Data/Schemas/User';
import {
    Question,
    IQuestion,
    IQuestionPopulatedUser,
} from 'src/Data/Schemas/Question';
import { retryWrapper, ExponentialBackOff } from 'src/util/RetryPolicies';

/**
 * Initiates the connection to the CosmosDB database.
 * @param mongoURI - The mongoDB connection string for the CosmosDB database.
 */
export const initiateConnection = async (mongoURI: string) => {
    await mongoose.connect(mongoURI, { useFindAndModify: false });
};

/**
 * Creates initial QnA session document and stores it in the database
 * @param title - title of QnA
 * @param description - description of QnA
 * @param userName - name of the user who created the QnA
 * @param userAadObjId - AAD Object Id of the suer who created the QnA
 * @param activityId - id of the master card message used for proactive updating
 * @param tenantId - id of tenant the bot is running on.
 * @param scopeId - channel id or group chat id
 * @param isChannel - whether the QnA session was started in a channel or group chat
 */
export const createQnASession = async (
    title: string,
    description: string,
    userName: string,
    userAadObjId: string,
    activityId: string,
    conversationId: string,
    tenantId: string,
    scopeId: string,
    isChannel: boolean
): Promise<{ qnaSessionId: string; hostId: string }> => {
    await getUserOrCreate(userAadObjId, userName);

    const qnaSession = new QnASession({
        title: title,
        description: description,
        hostId: userAadObjId,
        activityId: activityId,
        conversationId: conversationId,
        tenantId: tenantId,
        isActive: true,
        scope: {
            scopeId: scopeId,
            isChannel: isChannel,
        },
    });

    const savedSession: mongoose.MongooseDocument = await retryWrapper(() =>
        qnaSession.save()
    );

    return { qnaSessionId: savedSession._id, hostId: userAadObjId };
};

/**
 * Updates the activity id of an existing QnA session
 * @param qnaSessionId - document database id of the QnA session
 * @param activityId - id of the master card message used for proactive updating of the card
 */
export const updateActivityId = async (
    qnaSessionId: string,
    activityId: string
) => {
    await retryWrapper(
        () =>
            QnASession.findByIdAndUpdate({ _id: qnaSessionId }, { activityId }),
        new ExponentialBackOff()
    );
};

/**
 * Disconnects the connection to the CosmosDB database.
 */
export const disconnect = async (): Promise<void> => {
    await mongoose.disconnect();
};

/**
 * Returns all the questions under an QnA with the details of the users filled.
 * @param qnaSessionId - the DBID of the QnA session from which to retrieve the questions.
 * @returns - Array of Question documents under the QnA.
 * @throws - Error thrown when finding questions or populating userId field of question documents fails.
 */
export const getQuestionData = async (
    qnaSessionId: string
): Promise<IQuestionPopulatedUser[]> => {
    const questionData: IQuestion[] = await retryWrapper<IQuestion[]>(() =>
        Question.find({
            qnaSessionId: qnaSessionId,
        })
            .populate({ path: 'userId', model: User })
            .exec()
    );
    if (isIQuestion_populatedUserArray(questionData))
        return <IQuestionPopulatedUser[]>questionData;
    else {
        throw new Error('Incorrect type received for questions array');
    }
};

/**
 * Type guard to check if an array of Question documents has the userId field populated or not. This type guard should be made stronger.
 * @param questions - array of Question documents
 */
const isIQuestion_populatedUserArray = (
    questions: IQuestionPopulatedUser[] | IQuestion[]
): questions is IQuestionPopulatedUser[] => {
    const unknownUser = new User({
        _id: 'unknownUser',
        userName: 'Unkown User',
    });

    for (let i = 0; i < questions.length; i++) {
        if (questions[i].userId === null) questions[i].userId = unknownUser;
    }
    return true;
};

/**
 * Retrives top N questions with the highest number of votes.
 * @param qnaSessionId - the DBID of the QnA session from which to retrieve the questions.
 * @param n - number of questions to retrieve. Must be positive.
 * @returns - Array of Question documents in the QnA and total questions in QnA.
 */
export const getQuestions = async (
    qnaSessionId: string,
    topN?: number,
    recentN?: number
): Promise<{
    topQuestions?: IQuestionPopulatedUser[];
    recentQuestions?: IQuestionPopulatedUser[];
    numQuestions: number;
}> => {
    const questionData = await getQuestionData(qnaSessionId);
    let voteSorted, recentSorted;

    if (recentN)
        // most recent question comes first at index 0
        recentSorted = questionData
            .sort(
                (a: any, b: any) =>
                    new Date(b.dateTimeCreated).getTime() -
                    new Date(a.dateTimeCreated).getTime()
            )
            .slice(0, recentN);

    if (topN)
        // descending order, so [0, 1, 2] => [2, 1, 0]
        voteSorted = questionData
            .sort((a: any, b: any) => b.voters.length - a.voters.length)
            .slice(0, topN);
    return {
        topQuestions: topN ? voteSorted : null,
        recentQuestions: recentN ? recentSorted : null,
        numQuestions: questionData.length,
    };
};

export const getQnASessionData = async (qnaSessionId: string) => {
    const qnaSessionData = await retryWrapper(() =>
        QnASession.findById(qnaSessionId)
            .populate({
                path: 'hostId',
                modle: User,
            })
            .exec()
    );
    if (!qnaSessionData) throw new Error('QnA Session not found');

    const _qnaSessionData: IQnASession_populated = (<IQnASession>(
        qnaSessionData
    )).toObject();

    // activity id must be set before this function gets called
    if (!_qnaSessionData.activityId)
        throw new Error('QnA Session `activityId` not found');

    return {
        title: _qnaSessionData.title,
        userName: _qnaSessionData.hostId.userName,
        activityId: _qnaSessionData.activityId,
        conversationId: _qnaSessionData.conversationId,
        userAadObjId: _qnaSessionData.hostId._id,
        description: _qnaSessionData.description,
        isActive: _qnaSessionData.isActive,
    };
};

/**
 * Writes a new question to the database.
 * @param qnaTeamsSessionId - id of the current QnA session
 * @param userAadObjId - AAD Object ID of user
 * @param userTeamsName - Name of user on Teams
 * @param questionContent - Question asked by user
 * @returns Returns true if question was successfully created
 * @throws Error thrown when database fails to save the question
 */
export const createQuestion = async (
    qnaTeamsSessionId: string,
    userAadObjId: string,
    userTeamsName: string,
    questionContent: string
): Promise<boolean> => {
    await getUserOrCreate(userAadObjId, userTeamsName);
    await isExistingQnASession(qnaTeamsSessionId);

    const question = new Question({
        qnaSessionId: qnaTeamsSessionId,
        userId: userAadObjId,
        content: questionContent,
    });

    await retryWrapper(() => question.save(), new ExponentialBackOff());

    return true;
};

/**
 * If user exists, finds the specified user and updates information.
 * Otherwise, if user doesn't exist, will create new user with provided parameters.
 * @param userAadObjId - AAD Object Id of user
 * @param userTeamsName - Name of user on Teams
 * @returns Returns true if user was successfully created or updated
 * @throws Error thrown when database fails to find and create or update the specified user
 */
export const getUserOrCreate = async (
    userAadObjId: string,
    userTeamsName: string
): Promise<boolean> => {
    await retryWrapper(() =>
        User.findByIdAndUpdate(
            userAadObjId,
            { $set: { _id: userAadObjId, userName: userTeamsName } },
            { upsert: true }
        )
    );

    return true;
};

/**
 * Adds the aadObjectId of the user upvoting the question to the 'voters' array of that question document if the user has not already upvoted the question.
 * Otherwise, removes their aadObjectId from the voters list to reflect taking back their upvote.
 * @param questionId - The DBID of the question document for the question being upvoted.
 * @param aadObjectId - The aadObjectId of the user upvoting the question.
 * @param name - The name of the user upvoting the question, used for creating a new User document if one doesn't exist.
 */
export const updateUpvote = async (
    questionId: string,
    aadObjectId: string,
    name: string
): Promise<IQuestion> => {
    await getUserOrCreate(aadObjectId, name);

    return await retryWrapper<IQuestion>(async () => {
        const question: IQuestion = <IQuestion>(
            await Question.findById(questionId)
        );

        const qnaSession: IQnASession = <IQnASession>(
            await QnASession.findById(question.qnaSessionId)
        );

        if (qnaSession.isActive) {
            if (question.voters.includes(aadObjectId))
                question.voters.splice(question.voters.indexOf(aadObjectId), 1);
            else {
                question.voters.push(aadObjectId);
            }

            await question.save();
        }

        return question;
    }, new ExponentialBackOff());
};

/*
 * Ends the QnA by changing fields: isActive to false and dateTimeEnded to current time
 * @param qnaSessionId - id of the current QnA session
 * @throws Error thrown when database fails to execute changes
 */
export const endQnASession = async (qnaSessionId: string) => {
    await isExistingQnASession(qnaSessionId);
    const result = await retryWrapper(
        () =>
            QnASession.findByIdAndUpdate(qnaSessionId, {
                $set: { isActive: false, dateTimeEnded: new Date() },
            }).exec(),
        new ExponentialBackOff()
    );

    if (!result) throw new Error('QnA Session not found');
};

/**
 * If QnA session exists, will return true
 * Otherwise, if QnA session doesn't exist, will throw an error.
 * @param qnaTeamsSessionId - id of the current QnA session
 * @returns true if qnaTeamsSessionId is in the database
 * @throws Error thrown when database fails to find the qnaTeamsSessionId
 */
export const isExistingQnASession = async (
    qnaTeamsSessionId: string
): Promise<boolean> => {
    const result = await retryWrapper(() =>
        QnASession.findById(qnaTeamsSessionId)
    );

    if (!result) throw new Error('QnA Session record not found');
    return true;
};

/**
 * Checks if the user is the host for this QnA session, returns true if
 * id matches records, false otherwise
 * @param qnaSessionId - id of the current QnA session
 * @param userAadjObjId - aadObjId of the current user
 * @throws Error when failed to find matching QnA session with the user ID
 */
export const isHost = async (
    qnaSessionId: string,
    userAadjObjId: string
): Promise<boolean> => {
    const result = await retryWrapper<IQnASession[]>(() =>
        QnASession.find({
            _id: qnaSessionId,
            hostId: userAadjObjId,
        }).exec()
    );

    if (result.length == 0) return false;

    return true;
};

/**
 * Checks the status of the QnA session, returns true if
 * database records indicate active otherwise returns false
 * @param qnaTeamsSessionId - id of the current QnA session
 */
export const isActiveQnA = async (
    qnaTeamsSessionId: string
): Promise<boolean> => {
    const result = await retryWrapper<IQnASession | null>(() =>
        QnASession.findById(qnaTeamsSessionId).exec()
    );
    if (!result) throw new Error('Result is empty');

    return result.isActive;
};
