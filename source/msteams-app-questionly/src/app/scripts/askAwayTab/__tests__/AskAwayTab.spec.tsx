/**
 * @jest-environment jsdom
 */
// tslint:disable:no-relative-imports
import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { AskAwayTab } from '../AskAwayTab';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import TabContent from '../TabContent';
import MeetingPanel from '../MeetingPanel';

configure({ adapter: new enzymeAdapterReact16() });

describe('AskAwayTab Component', () => {
    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTab />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the MeetingPanel when frameContext is set to sidepanel', () => {
        const component = shallow(<AskAwayTab />);
        component.setState({
            frameContext: 'sidePanel',
        });

        expect(component.find(MeetingPanel)).toHaveLength(1);
    });

    it('should render the TabContent when frameContext is set to content', () => {
        const component = shallow(<AskAwayTab />);
        component.setState({
            frameContext: 'content',
        });

        expect(component.find(TabContent)).toHaveLength(1);
    });
});
