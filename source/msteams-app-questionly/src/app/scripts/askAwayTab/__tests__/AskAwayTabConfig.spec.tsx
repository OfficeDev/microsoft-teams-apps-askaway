/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
// tslint:disable-next-line:no-relative-imports
import { AskAwayTabConfig } from '../AskAwayTabConfig';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';

configure({ adapter: new enzymeAdapterReact16() });

describe('AskAwayTabConfig Component', () => {
    // Snapshot Test Sample
    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTabConfig />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
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
