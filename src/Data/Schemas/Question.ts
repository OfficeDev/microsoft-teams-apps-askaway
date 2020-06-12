import * as mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    amaSessionId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'AMASession',
        required: true,
    },
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
    },
    voters: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
    datetimeCreated: {
        type: Date,
        default: Date.now,
    },
});

export const Question = mongoose.model('Question', QuestionSchema);
