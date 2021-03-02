import * as mongoose from "mongoose";
import { IUser } from "./user";

const QnASessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 1,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 1,
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    hostId: {
      type: String,
      ref: "User",
      required: true,
    },
    hostUserId: {
      type: String,
      required: true,
    },
    activityId: {
      type: String,
      required: false,
    },
    conversationId: {
      type: String,
      required: true,
    },
    tenantId: {
      type: String,
      required: true,
    },
    // The following id is the group chat or channel id based on the context of this session.
    scope: {
      scopeId: {
        type: String,
        required: true,
      },
      isChannel: {
        type: Boolean,
        required: true,
      },
    },
    dateTimeCreated: {
      type: Date,
      default: () => new Date(),
    },
    dateTimeEnded: {
      type: Date,
      required: false,
    },
    // Version number for events sent to clients for real time refresh.
    dataEventVersion: {
      type: Number,
      required: false,
    },
    // Date time when adaptive card was last updated.
    dateTimeCardLastUpdated: {
      type: Date,
      required: false,
    },
    // Date time when next adaptive card is scheduled.
    dateTimeNextCardUpdateScheduled: {
      type: Date,
      required: false,
    },
    // AAD object id of user who ended QnA session
    endedById: {
      type: String,
      ref: "User",
      required: false,
    },
    // Teams id of user who ended QnA session
    endedByUserId: {
      type: String,
      required: false,
    },
    // Time stamp when `end` operation is locked. If this field is not set, it means document is not locked.
    dateTimeEndOperationLockAcquired: {
      type: Date,
      required: false,
    },
    // Time to live in seconds.
    // Used to expire non meeting chat (orphaned) ama sessions for which adaptive card did not get posted.
    ttl: {
      type: Number,
      required: false,
    },
  },
  { optimisticConcurrency: true }
);

interface IQnASessionBase extends mongoose.Document {
  title: string;
  description: string;
  isActive: boolean;
  activityId?: string;
  conversationId: string;
  tenantId: string;
  scope: {
    scopeId: string;
    isChannel: boolean;
  };
  hostUserId: string;
  dateTimeCreated: Date;
  dateTimeEnded?: Date;
  dataEventVersion: Number;
  dateTimeCardLastUpdated?: Date;
  dateTimeNextCardUpdateScheduled?: Date;
  endedByUserId?: string;
  dateTimeEndOperationLockAcquired?: Date;
  ttl?: Number;
}

/**
 * Exports the IQnASession interface for external use. This interface should be used when the hostId field is a string reference.
 */
export interface IQnASession extends IQnASessionBase {
  hostId: IUser["_id"];
  endedById?: IUser["_id"];
}

/**
 * Exports the IQnASession_populated interface for external use. This interface should be used when the hostId field is populated.
 */
export interface IQnASession_populated extends IQnASessionBase {
  hostId: IUser;
  endedById?: IUser;
}

/**
 * Exports the QnASession schema model for external use.
 */
export const QnASession =
  mongoose.models.QnASession ||
  mongoose.model<IQnASession>("QnASession", QnASessionSchema);
