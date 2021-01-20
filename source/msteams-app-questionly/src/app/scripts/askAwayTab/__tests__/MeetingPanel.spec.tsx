/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import { Loader, Button } from '@fluentui/react-northstar';
import Adapter from 'enzyme-adapter-react-16';
import MeetingPanel from '../MeetingPanel';
import { HttpService } from '../shared/HttpService';
import { telemetryService } from '../../telemetryService';
import Helper from '../shared/Helper';

configure({ adapter: new Adapter() });

describe('Meeting Panel Component', () => {
    const httpServiceIns = new HttpService(telemetryService.appInsights);

    beforeAll(() => {
        jest.mock('../shared/HttpService');
    });

    afterAll(() => {
        jest.resetAllMocks();
    });

    it('should render loader when showloader value is true', () => {
        const component = shallow(<MeetingPanel teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} appInsights={telemetryService.appInsights} helper={Helper} />);
        const stateVal = { showLoader: true };
        component.setState(stateVal);

        expect(component.find(Loader)).toHaveLength(1);
    });

    it('should render meeting panel when activeSessionData is present', () => {
        const component = shallow(<MeetingPanel teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} appInsights={telemetryService.appInsights} helper={Helper} />);
        const stateVal = { showLoader: false, activeSessionData: true };
        component.setState(stateVal);
        const divEle = component.find('div.meeting-panel');

        expect(divEle).toHaveLength(1);
    });

    it('should render createSessionLayout when activeSessionData is not present', () => {
        const component = shallow(<MeetingPanel teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} appInsights={telemetryService.appInsights} helper={Helper} />);
        const stateVal = { showLoader: false };
        component.setState(stateVal);
        const buttonEle = component.containsMatchingElement(<Button.Content>Start a Q&A session</Button.Content>);

        expect(buttonEle).toBeTruthy();
    });
});
