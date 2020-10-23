import { retryWrapper } from 'src/util/retryPolicies';
import { IUser, User } from 'src/data/schemas/user';

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

    /**
     * Find user by id.
     * @param userAadObjId - AAD Object Id of user
     * @returns Returns true if user was successfully found
     * @throws Error thrown when database fails to find and create or update the specified user
     */
    public async getUser(userAadObjId: IUser): Promise<IUser> {
        const user: IUser = await retryWrapper<IUser>(() =>
            User.findById(userAadObjId)
        );
        if (user === undefined) throw new Error('User not found');
        return user;
    }
}

export const userDataService = new UserDataService();
