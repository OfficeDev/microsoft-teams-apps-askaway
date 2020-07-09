import * as mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    amaSessionId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'AMASession',
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
        default: Date.now,
    },
});

/**
 * Exports the Question schema model for external use.
 */
export const Question = mongoose.model('Question', QuestionSchema);
