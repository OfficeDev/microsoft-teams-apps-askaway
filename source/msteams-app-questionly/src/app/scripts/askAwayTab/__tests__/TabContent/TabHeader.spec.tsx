/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Flex, Button, Divider } from '@fluentui/react-northstar';
import { AddIcon, RetryIcon } from '@fluentui/react-icons-northstar';
import Adapter from 'enzyme-adapter-react-16';
import TabHeader from '../../TabContent/TabHeader';
import { Helper } from '../../shared/Helper';
import { SwitchIcon } from '../../shared/Icons/SwitchIcon';

configure({ adapter: new Adapter() });

describe('TabHeader Component', () => {
    const activeSessionData = new Helper().createEmptyActiveSessionData();
    const refreshSession = jest.fn();
    const t = jest.fn();
    const endSession = jest.fn();
    const showTaskModule = jest.fn();

    it('should match the snapshot', () => {
        const wrapper = shallow(<TabHeader t={t} refreshSession={refreshSession} endSession={endSession} showTaskModule={showTaskModule} activeSessionData={activeSessionData} />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<TabHeader t={t} refreshSession={refreshSession} endSession={endSession} showTaskModule={showTaskModule} activeSessionData={activeSessionData} />);
        console.log(component.debug());
        expect(component.find(Flex)).toHaveLength(1);
        expect(component.find(Divider)).toHaveLength(1);
        expect(component.find(Button)).toHaveLength(3);
        expect(component.find(AddIcon)).toHaveLength(1);
        expect(component.find(RetryIcon)).toHaveLength(1);
        expect(component.find(SwitchIcon)).toHaveLength(1);
    });
});
