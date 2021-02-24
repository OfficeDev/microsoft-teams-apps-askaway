/**
 * @jest-environment jsdom
 */
import { Text } from '@fluentui/react-northstar';
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import enzymeToJson from 'enzyme-to-json';
import * as React from 'react';
import { AskAwayTabConfig } from '../AskAwayTabConfig';

configure({ adapter: new enzymeAdapterReact16() });

describe('AskAwayTabConfig Component', () => {
    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTabConfig />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it.skip('should render the tab', () => {
        const component = shallow(<AskAwayTabConfig />);
        const divResult = component.containsMatchingElement(<Text content="Select save to finish adding Ask Away to the meeting" />);
        expect(divResult).toBeTruthy();
    });
});
