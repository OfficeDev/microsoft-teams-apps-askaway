/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
// tslint:disable-next-line:no-relative-imports
import { AskAwayTab } from '../AskAwayTab';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';

configure({ adapter: new enzymeAdapterReact16() });

describe('AskAwayTab Component', () => {
    // Snapshot Test Sample
    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTab />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
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
