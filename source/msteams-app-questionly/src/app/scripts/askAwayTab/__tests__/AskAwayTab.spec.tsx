/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import toJson from 'enzyme-to-json';
import { AskAwayTab } from '../AskAwayTab';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

describe('AskAwayTab Component', () => {
    // Snapshot Test Sample
    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTab />);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    // Component Test Sample
    it('should render the tab', () => {
        const component = shallow(<AskAwayTab />);
        const divResult = component.containsMatchingElement(
            <h3>This is react tab!</h3>
        );

        expect(divResult).toBeTruthy();
    });
});
