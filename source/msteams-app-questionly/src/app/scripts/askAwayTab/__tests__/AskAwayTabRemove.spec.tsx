/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Header } from '@fluentui/react-northstar';
import { AskAwayTabRemove } from '../AskAwayTabRemove';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

describe('AskAwayTabRemove Component', () => {
    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTabRemove />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<AskAwayTabRemove />);
        const divResult = component.containsMatchingElement(<Header content="You're about to remove your tab..." />);

        expect(divResult).toBeTruthy();
    });
});
