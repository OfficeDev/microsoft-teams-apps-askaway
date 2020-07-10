import * as mongoose from 'mongoose';
import { IUser } from './User';

const AMASessionSchema = new mongoose.Schema({
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
        default: new Date(),
    },
    dateTimeEnded: {
        type: Date,
        required: false,
    },
});

interface IAMASessionBase extends mongoose.Document {
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
 * Exports the IAMASession interface for external use. This interface should be used when the hostId field is a string reference.
 */
export interface IAMASession extends IAMASessionBase {
    hostId: IUser['_id'];
}

/**
 * Exports the IAMASession_populated interface for external use. This interface should be used when the hostId field is populated.
 */
export interface IAMASession_populated extends IAMASessionBase {
    hostId: IUser;
}

/**
 * Exports the AMASession schema model for external use.
 */
export const AMASession = mongoose.model<IAMASession>(
    'AMASession',
    AMASessionSchema
);
