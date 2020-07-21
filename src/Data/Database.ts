/* eslint-disable no-console */
import * as mongoose from 'mongoose';
import {
    AMASession,
    IAMASession_populated,
    IAMASession,
} from './Schemas/AMASession';
import { User } from './Schemas/User';
import {
    Question,
    IQuestion,
    IQuestionPopulatedUser,
} from './Schemas/Question';

/**
 * Initiates the connection to the CosmosDB database.
 * @param mongoURI - The mongoDB connection string for the CosmosDB database.
 */
export const initiateConnection = async (
    mongoURI: string
): Promise<boolean> => {
    await mongoose
        .connect(mongoURI, { useFindAndModify: false })
        .then(() => console.log('Connection to CosmosDB successful'));
    return true;
};

/**
 * Creates initial AMA session document and stores it in the database
 * @param title - title of AMA
 * @param description - description of AMA
 * @param userName - name of the user who created the AMA
 * @param userAadObjId - AAD Object Id of the suer who created the AMA
 * @param activityId - id of the master card message used for proactive updating
 * @param tenantId - id of tenant the bot is running on.
 * @param scopeId - channel id or group chat id
 * @param isChannel - whether the AMA session was started in a channel or group chat
 */
export const createAMASession = async (
    title: string,
    description: string,
    userName: string,
    userAadObjId: string,
    activityId: string,
    tenantId: string,
    scopeId: string,
    isChannel: boolean
): Promise<{ amaSessionId: string; hostId: string }> => {
    await getUserOrCreate(userAadObjId, userName);

    const amaSession = new AMASession({
        title: title,
        description: description,
        hostId: userAadObjId,
        activityId: activityId,
        tenantId: tenantId,
        isActive: true,
        scope: {
            scopeId: scopeId,
            isChannel: isChannel,
        },
    });

    const savedSession: mongoose.MongooseDocument = await amaSession.save();

    return { amaSessionId: savedSession._id, hostId: userAadObjId };
};

/**
 * Updates the activity id of an existing AMA session
 * @param amaSessionId - document database id of the AMA session
 * @param activityId - id of the master card message used for proactive updating of the card
 */
export const updateActivityId = async (
    amaSessionId: string,
    activityId: string
) => {
    await AMASession.findByIdAndUpdate({ _id: amaSessionId }, { activityId });
};

/**
 * Disconnects the connection to the CosmosDB database.
 */
export const disconnect = async (): Promise<void> => {
    await mongoose.disconnect();
};

/**
 * Returns all the questions under an AMA with the details of the users filled.
 * @param amaSessionId - the DBID of the AMA session from which to retrieve the questions.
 * @returns - Array of Question documents under the AMA.
 * @throws - Error thrown when finding questions or populating userId field of question documents fails.
 */
export const getQuestionData = async (
    amaSessionId: string
): Promise<Array<IQuestionPopulatedUser>> => {
    const questionData: IQuestion[] = await Question.find({
        amaSessionId: amaSessionId,
    })
        .populate({ path: 'userId', model: User })
        .exec();
    if (isIQuestion_populatedUserArray(questionData))
        return questionData as IQuestionPopulatedUser[];
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
 * @param amaSessionId - the DBID of the AMA session from which to retrieve the questions.
 * @param n - number of questions to retrieve. Must be positive.
 * @returns - Array of Question documents in the AMA and total questions in AMA.
 */
export const getQuestions = async (
    amaSessionId: string,
    topN?: number,
    recentN?: number
): Promise<{
    topQuestions?: IQuestionPopulatedUser[];
    recentQuestions?: IQuestionPopulatedUser[];
    numQuestions: number;
}> => {
    const questionData = await getQuestionData(amaSessionId);
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

export const getAMASessionData = async (amaSessionId: string) => {
    const amaSessionData = await AMASession.findById(amaSessionId)
        .populate({ path: 'hostId', modle: User })
        .exec();
    if (!amaSessionData) throw new Error('AMA Session not found');

    const _amaSessionData: IAMASession_populated = (amaSessionData as IAMASession).toObject();

    // activity id must be set before this function gets called
    if (!_amaSessionData.activityId)
        throw new Error('AMA Session `activityId` not found');

    return {
        title: _amaSessionData.title,
        userName: _amaSessionData.hostId.userName,
        activityId: _amaSessionData.activityId,
        userAadObjId: _amaSessionData.hostId._id,
        description: _amaSessionData.description,
        isActive: _amaSessionData.isActive,
    };
};

/**
 * Writes a new question to the database.
 * @param amaTeamsSessionId - id of the current AMA session
 * @param userAadObjId - AAD Object ID of user
 * @param userTeamsName - Name of user on Teams
 * @param questionContent - Question asked by user
 * @returns Returns true if question was successfully created
 * @throws Error thrown when database fails to save the question
 */
export const createQuestion = async (
    amaTeamsSessionId: string,
    userAadObjId: string,
    userTeamsName: string,
    questionContent: string
): Promise<boolean> => {
    await getUserOrCreate(userAadObjId, userTeamsName);
    await isExistingAMASession(amaTeamsSessionId);

    const question = new Question({
        amaSessionId: amaTeamsSessionId,
        userId: userAadObjId,
        content: questionContent,
    });

    await question.save();
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
    await User.findByIdAndUpdate(
        userAadObjId,
        { $set: { _id: userAadObjId, userName: userTeamsName } },
        { upsert: true }
    );

    return true;
};

/**
 * Adds the aadObjectId of the user upvoting the question to the 'voters' array of that question document.
 * @param questionId - The DBID of the question document for the question being upvoted.
 * @param aadObjectId - The aadObjectId of the user upvoting the question.
 * @param name - The name of the user upvoting the question, used for creating a new User document if one doesn't exist.
 */
export const addUpvote = async (
    questionId: string,
    aadObjectId: string,
    name: string
): Promise<IQuestion> => {
    await getUserOrCreate(aadObjectId, name);

    const question = (await Question.findByIdAndUpdate(
        questionId,
        {
            $addToSet: { voters: aadObjectId },
        },
        {
            new: true,
        }
    )) as IQuestion;

    return question;
};

/*
 * Ends the AMA by changing fields: isActive to false and dateTimeEnded to current time
 * @param amaSessionId - id of the current AMA session
 * @throws Error thrown when database fails to execute changes
 */
export const endAMASession = async (amaSessionId: string) => {
    await isExistingAMASession(amaSessionId);
    const result = await AMASession.findByIdAndUpdate(amaSessionId, {
        $set: { isActive: false, dateTimeEnded: new Date() },
    }).exec();

    if (!result) throw new Error('AMA Session not found');
};

/**
 * If AMA session exists, will return true
 * Otherwise, if AMA session doesn't exist, will throw an error.
 * @param amaTeamsSessionId - id of the current AMA session
 * @returns true if amaTeamsSessionId is in the database
 * @throws Error thrown when database fails to find the amaTeamsSessionId
 */
export const isExistingAMASession = async (
    amaTeamsSessionId: string
): Promise<boolean> => {
    const result = await AMASession.findById(amaTeamsSessionId);

    if (!result) throw new Error('AMA Session record not found');

    return true;
};

/**
 * Checks if the user is the host for this AMA session, returns true if
 * id matches records, false otherwise
 * @param amaSessionId - id of the current AMA session
 * @param userAadjObjId - aadObjId of the current user
 * @throws Error when failed to find matching AMA session with the user ID
 */
export const isHost = async (
    amaSessionId: string,
    userAadjObjId: string
): Promise<boolean> => {
    const result = await AMASession.find({
        _id: amaSessionId,
        hostId: userAadjObjId,
    }).exec();

    if (result.length == 0) return false;

    return true;
};

/**
 * Checks the status of the AMA session, returns true if
 * database records indicate active otherwise returns false
 * @param amaTeamsSessionId - id of the current AMA session
 */
export const isActiveAMA = async (
    amaTeamsSessionId: string
): Promise<boolean> => {
    const result = await AMASession.findById(amaTeamsSessionId).exec();
    if (!result) throw new Error('Result is empty');

    return result.isActive;
};
