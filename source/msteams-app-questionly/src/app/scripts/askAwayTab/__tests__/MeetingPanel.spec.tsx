/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure, mount } from 'enzyme';
import { Loader } from '@fluentui/react-northstar';
import toJson from 'enzyme-to-json';
import Adapter from 'enzyme-adapter-react-16';
import MeetingPanel from '../MeetingPanel';
import { telemetryService } from '../../telemetryService';
import { HttpService } from '../shared/HttpService';

configure({ adapter: new Adapter() });

describe('Meeting Panel Component', () => {
    const httpServiceIns = new HttpService(telemetryService.appInsights);

    beforeAll(() => {
        jest.mock('../shared/HttpService');
    });

    afterAll(() => {
        jest.resetAllMocks();
    });
    // Snapshot Test Sample
    it('should match the snapshot', () => {
        const wrapper = shallow(
            <MeetingPanel
                teamsData={{}}
                httpService={httpServiceIns}
                appInsights={telemetryService.appInsights}
            />
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    // Component Test Sample
    it('should render loader when showloader value is true', () => {
        const component = shallow(
            <MeetingPanel
                teamsData={{}}
                httpService={httpServiceIns}
                appInsights={telemetryService.appInsights}
            />
        );
        const stateVal = { showLoader: true };
        component.setState(stateVal);

        expect(component.find(Loader)).toHaveLength(1);
    });

    it('should render meeting panel when activeSessionData is present', () => {
        const component = mount(
            <MeetingPanel
                teamsData={{}}
                httpService={httpServiceIns}
                appInsights={telemetryService.appInsights}
            />
        );
        const stateVal = { showLoader: false, activeSessionData: true };
        component.setState(stateVal);
        const divEle = component.find('div.meeting-panel');

        expect(divEle).toHaveLength(1);
    });

    it('should render createSessionLayout when activeSessionData is not present', () => {
        const component = mount(
            <MeetingPanel
                teamsData={{}}
                httpService={httpServiceIns}
                appInsights={telemetryService.appInsights}
            />
        );
        const stateVal = { showLoader: false };
        component.setState(stateVal);
        const divEle = component.find('div.no-question');

        expect(divEle).toHaveLength(1);
    });
});
