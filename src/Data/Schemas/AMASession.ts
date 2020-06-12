import * as mongoose from 'mongoose';
import { boolean, string } from 'yargs';

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
        type: boolean,
        required: true,
    },
    hostId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
    },
    conversationId: {
        type: string,
        required: true,
    },
    tenantId: {
        type: string,
        required: true,
    },
    // The following id is the group chat or channel id based on the context of this session.
    scope: {
        scopeId: {
            type: string,
            required: true,
        },
        isChannel: {
            type: boolean,
            required: true,
        },
        required: true,
    },
    datetimeCreated: {
        type: Date,
        default: Date.now,
    },
    datetimeEnded: {
        type: Date,
        required: false,
    },
});

export const AMASession = mongoose.model('AMASession', AMASessionSchema);
