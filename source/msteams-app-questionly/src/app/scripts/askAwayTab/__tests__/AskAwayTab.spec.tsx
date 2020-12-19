/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure, mount } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
// tslint:disable-next-line:no-relative-imports
import { AskAwayTab } from '../AskAwayTab';
import Adapter from 'enzyme-adapter-react-16';
import TabContent from '../TabContent';
import MeetingPanel from '../MeetingPanel';
import { CONST } from '../shared/ConfigVariables';

configure({ adapter: new Adapter() });

describe('AskAwayTab Component', () => {
    // Snapshot Test
    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTab />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    // Component Test
    it('should render the MeetingPanel when frameContext is set to sidepanel', () => {
        const component = shallow(<AskAwayTab />);
        component.setState({
            frameContext: CONST.TAB_FRAME_CONTEXT.FC_SIDEPANEL,
        });

        expect(component.find(MeetingPanel)).toHaveLength(1);
    });

    it('should render the TabContent when frameContext is set to content', () => {
        const component = shallow(<AskAwayTab />);
        component.setState({
            frameContext: CONST.TAB_FRAME_CONTEXT.FC_CONTENT,
        });

        expect(component.find(TabContent)).toHaveLength(1);
    });
});
