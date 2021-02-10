import { retryWrapper } from "./../utils/retryPolicies";
import { IUser, User } from "./../schemas/user";

export interface IUserDataService {
  getUserOrCreate: (
    userAadObjId: string,
    userTeamsName: string
  ) => Promise<IUser>;
  getUser: (userAadObjId: IUser) => Promise<IUser>;
}

export class UserDataService implements IUserDataService {
  /**
   * If user exists, finds the specified user and updates information.
   * Otherwise, if user doesn't exist, will create new user with provided parameters.
   * @param userAadObjId - AAD Object Id of user
   * @param userTeamsName - Name of user on Teams
   * @returns Returns created or updated user document
   * @throws Error thrown when database fails to find and create or update the specified user
   */
  public getUserOrCreate(
    userAadObjId: string,
    userTeamsName: string
  ): Promise<IUser> {
    return retryWrapper(() =>
      User.findByIdAndUpdate(
        userAadObjId,
        { $set: { _id: userAadObjId, userName: userTeamsName } },
        { upsert: true, new: true }
      )
    );
  }

  /**
   * Find user by id.
   * @param userAadObjId - AAD Object Id of user
   * @returns Returns true if user was successfully found
   * @throws Error thrown when database fails to find and create or update the specified user
   */
  public async getUser(userAadObjId: IUser): Promise<IUser> {
    const user = await retryWrapper<IUser>(() => User.findById(userAadObjId));
    if (user === undefined) throw new Error("User not found");
    return user;
  }
}
