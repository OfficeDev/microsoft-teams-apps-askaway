import { ParticipantRoles } from '../../../../enums/ParticipantRoles';
import { HttpService } from './HttpService';

/**
 * Gets meeting participant's role.
 * @param httpService - httpService instance.
 * @param conversationId - conversation Id.
 * @returns - user role.
 * @throws - any error occured while fetching user role.
 */
export const getCurrentParticipantRole = async (httpService: HttpService, conversationId?: string): Promise<ParticipantRoles> => {
    const response = await httpService.get(`/conversations/${conversationId}/me`);
    return response.data;
};

/**
 * Checks if user role is a presenter or organizer.
 * @param userRole - user role.
 * @returns - true if user role is presenter or organizer.
 */
export const isPresenterOrOrganizer = (userRole: ParticipantRoles): boolean => {
    return userRole === ParticipantRoles.Organizer || userRole === ParticipantRoles.Presenter;
};
