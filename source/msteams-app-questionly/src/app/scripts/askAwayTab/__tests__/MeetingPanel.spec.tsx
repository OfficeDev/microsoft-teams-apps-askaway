/**
 * @jest-environment jsdom
 */

import { Button, Loader } from '@fluentui/react-northstar';
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import * as React from 'react';
import { ParticipantRoles } from '../../../../enums/ParticipantRoles';
import { MeetingPanel } from '../MeetingPanel';
import Helper from '../shared/Helper';
import { HttpService } from '../shared/HttpService';
import { i18next } from '../shared/i18next';

configure({ adapter: new enzymeAdapterReact16() });

describe('Meeting Panel Component', () => {
    let httpServiceIns;
    let t;
    const tReady = true;
    const envConfig: { [key: string]: any } = {};
    beforeAll(() => {
        httpServiceIns = new HttpService();
        t = jest.fn();
        jest.mock('../shared/HttpService');
    });

    afterAll(() => {
        jest.resetAllMocks();
    });

    it('should render loader when showloader value is true', () => {
        const component = shallow(
            <MeetingPanel t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} helper={Helper} envConfig={envConfig} />
        );
        const stateVal = { showLoader: true };
        component.setState(stateVal);

        expect(component.find(Loader)).toHaveLength(1);
    });

    it('should render meeting panel when activeSessionData is present', () => {
        const component = shallow(
            <MeetingPanel t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} helper={Helper} envConfig={envConfig} />
        );
        const stateVal = { showLoader: false, activeSessionData: true };
        component.setState(stateVal);
        const divEle = component.find('div.meeting-panel');

        expect(divEle).toHaveLength(1);
    });

    it('should render presenter/organizer createSessionLayout view when activeSessionData is not present', () => {
        const component = shallow(
            <MeetingPanel t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} helper={Helper} envConfig={envConfig} />
        );
        const stateVal = { showLoader: false, userRole: ParticipantRoles.Presenter };
        component.setState(stateVal);
        const buttonEle = component.containsMatchingElement(<Button.Content>Start a Q&A session</Button.Content>);

        expect(buttonEle).toBeTruthy();
    });

    it('should render attendee createSessionLayout view when activeSessionData is not present', () => {
        const component = shallow(
            <MeetingPanel t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} helper={Helper} envConfig={envConfig} />
        );
        const stateVal = { showLoader: false, userRole: ParticipantRoles.Attendee };
        component.setState(stateVal);
        const buttonEle = component.containsMatchingElement(<Button.Content>Start a Q&A session</Button.Content>);

        // Create session button should not be visible to the attendee.
        expect(buttonEle).not.toBeTruthy();
    });
});
