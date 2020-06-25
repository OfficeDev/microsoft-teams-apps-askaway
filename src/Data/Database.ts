/* eslint-disable no-console */
import * as mongoose from 'mongoose';
import { Question } from './Schemas/Question';
import { User } from './Schemas/User';

/**
 * Initiates the connection to the CosmosDB database.
 * @param mongoURI - The mongoDB connection string for the CosmosDB database.
 */
export const initiateConnection = async (
    mongoURI: string
): Promise<boolean> => {
    await mongoose
        .connect(mongoURI)
        .then(() => console.log('Connection to CosmosDB successful'))
        .catch((error) => console.error(error));
    return true;
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
        .populate({ path: 'userId', modle: User })
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
 * @param amaTeamsSessionId - Teams Channel or Group Chat ID
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

    const question = new Question({
        amaSessionId: amaTeamsSessionId,
        userId: userAadObjId,
        content: questionContent,
    });

    const response = await question
        .save()
        .then((saveQuestion) => {
            console.log(saveQuestion);
            return true;
        })
        .catch((err) => {
            console.log(err);
            throw new Error('Failed to save question ');
        });

    return response;
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
        console.log(err);
        throw new Error('Failed to find and create/update user');
    });

    return true;
};
