import * as mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    aadObjectId: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
});

export const User = mongoose.model('User', UserSchema);
