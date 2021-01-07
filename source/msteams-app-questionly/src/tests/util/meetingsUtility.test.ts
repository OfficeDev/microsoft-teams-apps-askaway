import { getParticipantRole, isPresenterOrOrganizer } from 'src/util/meetingsUtility';

const sampleMeetingId = 'sampleMeetingId';
const sampleUserId = 'sampleUserId';
const sampleTenantId = 'sampleTenantId';
const sampleServiceUrl = 'sampleServiceUrl';

describe('validates isPreseterOrOrganizer', () => {
    beforeAll(() => {
        (<any>getParticipantRole) = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('test isPreseterOrOrganizer - when the user is Organizer', async () => {
        (<any>getParticipantRole).mockImplementationOnce(() => {
            return 'Organizer';
        });
        const result = await isPresenterOrOrganizer(sampleMeetingId, sampleUserId, sampleTenantId, sampleServiceUrl);
        expect(result).toBeTruthy();
        expect(getParticipantRole).toBeCalledTimes(1);
    });

    it('test isPreseterOrOrganizer - when the user is Presenter', async () => {
        (<any>getParticipantRole).mockImplementationOnce(() => {
            return 'Presenter';
        });
        const result = await isPresenterOrOrganizer(sampleMeetingId, sampleUserId, sampleTenantId, sampleServiceUrl);
        expect(result).toBeTruthy();
        expect(getParticipantRole).toBeCalledTimes(1);
    });

    it('test isPreseterOrOrganizer - when the user is neither Organizer nor Presenter', async () => {
        (<any>getParticipantRole).mockImplementationOnce(() => {
            return 'test';
        });
        const result = await isPresenterOrOrganizer(sampleMeetingId, sampleUserId, sampleTenantId, sampleServiceUrl);
        expect(result).toBeFalsy();
        expect(getParticipantRole).toBeCalledTimes(1);
    });
});
