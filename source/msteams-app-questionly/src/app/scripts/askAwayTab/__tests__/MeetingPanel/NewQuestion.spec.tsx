/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import Adapter from 'enzyme-adapter-react-16';
import NewQuestion from '../../MeetingPanel/NewQuestion';
import { HttpService } from '../../shared/HttpService';
import { Helper } from '../../shared/Helper';
import { Flex, Button, TextArea, FlexItem } from '@fluentui/react-northstar';
import { telemetryService } from '../../../telemetryService';

configure({ adapter: new Adapter() });

describe('AskAwayTabRemove Component', () => {
    const httpServiceIns = new HttpService(telemetryService.appInsights);
    const t = jest.fn();
    const activeSessionData = new Helper().createEmptyActiveSessionData();
    const onAddNewQuestion = jest.fn();
    it('should match the snapshot', () => {
        const wrapper = shallow(
            <NewQuestion t={t} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} activeSessionData={activeSessionData} onAddNewQuestion={onAddNewQuestion} />
        );
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(
            <NewQuestion t={t} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} activeSessionData={activeSessionData} onAddNewQuestion={onAddNewQuestion} />
        );
        console.log(component.debug());

        expect(component.find(Flex)).toHaveLength(1);
        expect(component.find(Button)).toHaveLength(1);
        expect(component.find(TextArea)).toHaveLength(1);
        expect(component.find(FlexItem)).toHaveLength(1);
    });
});
