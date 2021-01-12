/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import toJson from 'enzyme-to-json';
import Adapter from 'enzyme-adapter-react-16';
import TabContent from '../TabContent';
import { telemetryService } from '../../telemetryService';
import { HttpService } from '../shared/HttpService';
import * as microsoftTeams from '@microsoft/teams-js';
import Helper from '../shared/Helper';
import { Button, Text } from '@fluentui/react-northstar';

configure({ adapter: new Adapter() });

describe('TabContent Component', () => {
    const httpServiceIns = new HttpService(telemetryService.appInsights);

    beforeAll(() => {
        jest.mock('../shared/HttpService');
    });

    afterAll(() => {
        jest.resetAllMocks();
    });

    it('should match the snapshot', () => {
        const wrapper = shallow(<TabContent teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} appInsights={telemetryService.appInsights} helper={Helper} />);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('should render TabContent', () => {
        const component = shallow(<TabContent teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} appInsights={telemetryService.appInsights} helper={Helper} />);

        const buttonEle = component.containsMatchingElement(<Button.Content>Create an ask away</Button.Content>);

        const textEle = component.containsMatchingElement(<Text className="text-caption" content="Welcome to Ask Away! We’re glad you’re here." />);

        expect(buttonEle).toBeTruthy();
        expect(textEle).toBeTruthy();
    });
});
