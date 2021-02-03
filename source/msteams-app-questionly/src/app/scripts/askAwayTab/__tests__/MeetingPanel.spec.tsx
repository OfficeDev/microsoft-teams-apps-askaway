/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import { Loader, Button } from '@fluentui/react-northstar';
import Adapter from 'enzyme-adapter-react-16';
import { MeetingPanel } from '../MeetingPanel';
import { HttpService } from '../shared/HttpService';
import { telemetryService } from '../../telemetryService';
import Helper from '../shared/Helper';
import { ParticipantRoles } from '../../../../enums/ParticipantRoles';
import { i18next } from '../shared/i18next';

configure({ adapter: new Adapter() });

describe('Meeting Panel Component', () => {
    const httpServiceIns = new HttpService(telemetryService.appInsights);
    const t = jest.fn();
    const tReady = true;
    beforeAll(() => {
        jest.mock('../shared/HttpService');
    });

    afterAll(() => {
        jest.resetAllMocks();
    });

    it('should render loader when showloader value is true', () => {
        const component = shallow(
            <MeetingPanel t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} appInsights={telemetryService.appInsights} helper={Helper} />
        );
        const stateVal = { showLoader: true };
        component.setState(stateVal);

        expect(component.find(Loader)).toHaveLength(1);
    });

    it('should render meeting panel when activeSessionData is present', () => {
        const component = shallow(
            <MeetingPanel t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} appInsights={telemetryService.appInsights} helper={Helper} />
        );
        const stateVal = { showLoader: false, activeSessionData: true };
        component.setState(stateVal);
        const divEle = component.find('div.meeting-panel');

        expect(divEle).toHaveLength(1);
    });

    it('should render presenter/organizer createSessionLayout view when activeSessionData is not present', () => {
        const component = shallow(
            <MeetingPanel t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} appInsights={telemetryService.appInsights} helper={Helper} />
        );
        const stateVal = { showLoader: false, userRole: ParticipantRoles.Presenter };
        component.setState(stateVal);
        const buttonEle = component.containsMatchingElement(<Button.Content>Start a Q&A session</Button.Content>);

        expect(buttonEle).toBeTruthy();
    });

    it('should render attendee createSessionLayout view when activeSessionData is not present', () => {
        const component = shallow(
            <MeetingPanel t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} appInsights={telemetryService.appInsights} helper={Helper} />
        );
        const stateVal = { showLoader: false, userRole: ParticipantRoles.Attendee };
        component.setState(stateVal);
        const buttonEle = component.containsMatchingElement(<Button.Content>Start a Q&A session</Button.Content>);

        // Create session button should not be visible to the attendee.
        expect(buttonEle).not.toBeTruthy();
    });
});
