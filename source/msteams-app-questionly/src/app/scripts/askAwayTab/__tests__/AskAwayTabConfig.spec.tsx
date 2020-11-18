/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import toJson from 'enzyme-to-json';
import { AskAwayTabConfig } from '../AskAwayTabConfig';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

describe('AskAwayTabConfig Component', () => {
    // Snapshot Test Sample
    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTabConfig />);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    // Component Test Sample
    it('should render the tab', () => {
        const component = shallow(<AskAwayTabConfig />);
        const divResult = component.containsMatchingElement(
            <h3>Please click Save to get started!</h3>
        );

        expect(divResult).toBeTruthy();
    });
});
