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
import i18next from 'i18next';

configure({ adapter: new Adapter() });

describe('TabContent Component', () => {
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
            <TabContent
                teamsData={{}}
                tReady={false}
                t={() => ''}
                i18n={i18next}
                httpService={httpServiceIns}
                appInsights={telemetryService.appInsights}
            />
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    // Component Test Sample
    it('should render TabContent', () => {
        const component = mount(
            <TabContent
                teamsData={{}}
                tReady={false}
                t={() => ''}
                i18n={i18next}
                httpService={httpServiceIns}
                appInsights={telemetryService.appInsights}
            />
        );
        const divEle = component.find('div.screen');

        expect(divEle).toHaveLength(2);
    });
});
