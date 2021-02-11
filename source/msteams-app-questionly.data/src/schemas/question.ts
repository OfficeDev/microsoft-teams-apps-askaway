import * as mongoose from "mongoose";
import { IQnASession } from "./qnASession";
import { IUser } from "./user";

const QuestionSchema = new mongoose.Schema(
  {
    qnaSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QnASession",
      required: true,
    },
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      minlength: 1,
      trim: true,
    },
    voters: [{ type: String, ref: "User" }],
    dateTimeCreated: {
      type: Date,
      default: () => new Date(),
    },
    isAnswered: {
      type: Boolean,
      required: true,
    },
    // Time stamp when mark as answered operation is locked. If this field is not set, it means document is not locked.
    dateTimeMarkAsAnsweredOperationLockAcquired: {
      type: Date,
      required: false,
    },
  },
  { optimisticConcurrency: true }
);

interface IQuestionBase extends mongoose.Document {
  content: string;
  dateTimeCreated: Date;
  isAnswered: Boolean;
  dateTimeMarkAsAnsweredOperationLockAcquired?: Date;
}

/**
 * Exports the IQuestion interface for external use. This interface should be used when all of the referencing fields are string references (not populated).
 */
export interface IQuestion extends IQuestionBase {
  qnaSessionId: IQnASession["_id"];
  userId: IUser["_id"];
  voters: IUser["_id"][];
}

/**
 * Exports the IQuestion_populatedUser interface for external use. This interface should be used when out of all of the referencing fields only the userId field is populated.
 */
export interface IQuestionPopulatedUser extends IQuestionBase {
  qnaSessionId: IQnASession["_id"];
  userId: IUser;
  voters: IUser["_id"][];
}

/**
 * Exports the Question schema model for external use.
 */
export const Question =
  mongoose.models.Question ||
  mongoose.model<IQuestion>("Question", QuestionSchema);
