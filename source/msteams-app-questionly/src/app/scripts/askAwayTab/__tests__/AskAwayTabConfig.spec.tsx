/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import { Text } from '@fluentui/react-northstar';
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
            <Text content="Select save to finish adding ask away to the meeting" />
        );

        expect(divResult).toBeTruthy();
    });
});
