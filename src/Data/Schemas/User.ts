import * as mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    // The _id field which is the primary key of the document, will store the aadObjectId of the user.
    // So when creating a new User document, make sure to set the _id field to the aadObjectId of the user before saving.
    _id: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
});

/**
 * Exports the User schema model for external use.
 */
export const User = mongoose.model('User', UserSchema);
