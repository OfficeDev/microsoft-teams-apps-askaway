import mongoose from 'mongoose';
import { IUser } from './User';

const QnASessionSchema = new mongoose.Schema({
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
        ref: 'User',
        required: true,
    },
    activityId: {
        type: String,
        required: false,
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
});

interface IQnASessionBase extends mongoose.Document {
    title: string;
    description: string;
    isActive: boolean;
    activityId?: string;
    tenantId: string;
    scope: {
        scopeId: string;
        isChannel: boolean;
    };
    dateTimeCreated: Date;
    dateTimeEnded?: Date;
}

/**
 * Exports the IQnASession interface for external use. This interface should be used when the hostId field is a string reference.
 */
export interface IQnASession extends IQnASessionBase {
    hostId: IUser['_id'];
}

/**
 * Exports the IQnASession_populated interface for external use. This interface should be used when the hostId field is populated.
 */
export interface IQnASession_populated extends IQnASessionBase {
    hostId: IUser;
}

/**
 * Exports the QnASession schema model for external use.
 */
export const QnASession = mongoose.model<IQnASession>(
    'QnASession',
    QnASessionSchema
);