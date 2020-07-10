/* eslint-disable no-console */
import * as mongoose from 'mongoose';
import { AMASession } from './Schemas/AMASession';
import { User } from './Schemas/User';
import { Question } from './Schemas/Question';

/**
 * Initiates the connection to the CosmosDB database.
 * @param mongoURI - The mongoDB connection string for the CosmosDB database.
 */
export const initiateConnection = async (
    mongoURI: string
): Promise<boolean> => {
    await mongoose
        .connect(mongoURI, { useFindAndModify: false })
        .then(() => console.log('Connection to CosmosDB successful'))
        .catch((error) => console.error(error));
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
    const hostId = await getUserOrCreate(userAadObjId, userName);

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

    const savedSession: mongoose.MongooseDocument = await amaSession
        .save()
        .catch((err) => {
            throw new Error('Error saving AMA session: ' + err);
        });

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
    await AMASession.findByIdAndUpdate(
        { _id: amaSessionId },
        { activityId }
    ).catch((error) => {
        new Error(
            `Failed to update activityId of AMA session: ${amaSessionId}. ${error}`
        );
    });
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
export const getQuestionData = async (amaSessionId: string) => {
    const questionData = await Question.find({
        amaSessionId: amaSessionId,
    })
        .populate({ path: 'userId', model: User })
        .exec()
        .catch((error) => {
            console.error(error);
            throw new Error(
                'Retrieving questions or populating user details failed'
            );
        });
    return questionData;
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
    await getAMASession(amaTeamsSessionId);

    const question = new Question({
        amaSessionId: amaTeamsSessionId,
        userId: userAadObjId,
        content: questionContent,
    });

    const response = await question.save().catch((err) => {
        console.error(err);
        throw new Error('Failed to save question ');
    });

    console.log(response);
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
    ).catch((err) => {
        console.error(err);
        throw new Error('Failed to find and create/update user');
    });

    return true;
};

/**
 * Ends the AMA by changing fields: isActive to false and dateTimeEnded to current time
 * @param amaSessionId - id of the current AMA session
 * @returns Returns the AMA title, description, and mastercard activity id
 * @throws Error thrown when database fails to execute changes
 */
export const endAMASession = async (
    amaSessionId: string
): Promise<{ amaTitle: string; amaDesc: string; amaActivityId: string }> => {
    const resultAMA: any = await AMASession.findByIdAndUpdate(amaSessionId, {
        $set: { isActive: false, dateTimeEnded: new Date() },
    })
        .exec()
        .catch((err) => {
            console.error(err);
            throw new Error(
                'Failed to change isActive for AMASession to false and change dateTimeEnded to current time'
            );
        });

    return {
        amaTitle: resultAMA.title,
        amaDesc: resultAMA.description,
        amaActivityId: resultAMA.activityId,
    };
};

/**
 * If AMA session exists, will return true
 * Otherwise, if AMA session doesn't exist, will throw an error.
 * @param amaTeamsSessionId - id of the current AMA session
 * @returns true if amaTeamsSessionId is in the database
 * @throws Error thrown when database fails to find the amaTeamsSessionId
 */
export const getAMASession = async (
    amaTeamsSessionId: string
): Promise<boolean> => {
    await AMASession.findById(amaTeamsSessionId).catch((err) => {
        console.error(err);
        throw new Error('Failed to find AMA Session');
    });

    return true;
};
