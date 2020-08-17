import mongoose from 'mongoose';
import { IQnASession } from 'src/Data/Schemas/QnASession';
import { IUser } from 'src/Data/Schemas/user';

const QuestionSchema = new mongoose.Schema({
    qnaSessionId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'QnASession',
        required: true,
    },
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
    },
    voters: [{ type: String, ref: 'User' }],
    dateTimeCreated: {
        type: Date,
        default: () => new Date(),
    },
});

interface IQuestionBase extends mongoose.Document {
    content: string;
    dateTimeCreated: Date;
}

/**
 * Exports the IQuestion interface for external use. This interface should be used when all of the referencing fields are string references (not populated).
 */
export interface IQuestion extends IQuestionBase {
    qnaSessionId: IQnASession['_id'];
    userId: IUser['_id'];
    voters: IUser['_id'][];
}

/**
 * Exports the IQuestion_populatedUser interface for external use. This interface should be used when out of all of the referencing fields only the userId field is populated.
 */
export interface IQuestionPopulatedUser extends IQuestionBase {
    qnaSessionId: IQnASession['_id'];
    userId: IUser;
    voters: IUser['_id'][];
}

/**
 * Exports the Question schema model for external use.
 */
export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
