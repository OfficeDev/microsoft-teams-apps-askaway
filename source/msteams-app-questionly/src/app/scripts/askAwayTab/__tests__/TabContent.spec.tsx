/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure, mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import Adapter from 'enzyme-adapter-react-16';
import { TabContent } from '../TabContent';
import { telemetryService } from '../../telemetryService';
import { HttpService } from '../shared/HttpService';
import Helper from '../shared/Helper';

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
        const wrapper = shallow(
            <TabContent
                teamsTabContext={{}}
                httpService={httpServiceIns}
                appInsights={telemetryService.appInsights}
                helper={Helper}
            />
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('should render TabContent', () => {
        const component = mount(
            <TabContent
                teamsTabContext={{}}
                httpService={httpServiceIns}
                appInsights={telemetryService.appInsights}
                helper={Helper}
            />
        );
        const divEle = component.find('div.screen');

        expect(divEle).toHaveLength(2);
    });
});
