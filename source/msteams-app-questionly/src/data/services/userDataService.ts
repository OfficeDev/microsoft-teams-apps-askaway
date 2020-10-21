import { retryWrapper } from 'src/util/RetryPolicies';
import { User } from '../Schemas/user';

class UserDataService {
    /**
     * If user exists, finds the specified user and updates information.
     * Otherwise, if user doesn't exist, will create new user with provided parameters.
     * @param userAadObjId - AAD Object Id of user
     * @param userTeamsName - Name of user on Teams
     * @returns Returns true if user was successfully created or updated
     * @throws Error thrown when database fails to find and create or update the specified user
     */
    public async getUserOrCreate(
        userAadObjId: string,
        userTeamsName: string
    ): Promise<boolean> {
        await retryWrapper(() =>
            User.findByIdAndUpdate(
                userAadObjId,
                { $set: { _id: userAadObjId, userName: userTeamsName } },
                { upsert: true }
            )
        );

        return true;
    }
}

export const userDataService = new UserDataService();
