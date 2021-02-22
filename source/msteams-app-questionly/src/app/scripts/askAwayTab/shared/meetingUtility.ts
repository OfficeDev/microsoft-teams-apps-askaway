import { HttpService } from 'src/app/scripts/askAwayTab/shared/HttpService';
import { ClientDataContract } from 'src/contracts/clientDataContract';
import { ParticipantRoles } from 'src/enums/ParticipantRoles';

/**
 * Checks if user role is a presenter or organizer.
 * @param userRole - user role.
 * @returns - true if user role is presenter or organizer.
 */
export const isPresenterOrOrganizer = (userRole: ParticipantRoles): boolean => {
    return userRole === ParticipantRoles.Organizer || userRole === ParticipantRoles.Presenter;
};

/**
 * Gets meeting participant's username.
 * @param httpService - httpService instance.
 * @param conversationId - conversation Id.
 * @returns - user name.
 * @throws - any error occured while fetching user role.
 */
export const getCurrentParticipantInfo = async (httpService: HttpService, conversationId?: string): Promise<ClientDataContract.User> => {
    const response = await httpService.get(`/conversations/${conversationId}/me`);
    return response.data;
};
