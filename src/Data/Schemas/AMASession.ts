import * as mongoose from 'mongoose';

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
        default: Date.now,
    },
    dateTimeEnded: {
        type: Date,
        required: false,
    },
});

/**
 * Exports the AMASession schema model for external use.
 */
export const AMASession = mongoose.model('AMASession', AMASessionSchema);
