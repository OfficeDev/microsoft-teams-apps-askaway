/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Header } from '@fluentui/react-northstar';
// tslint:disable-next-line:no-relative-imports
import { AskAwayTabRemove } from '../AskAwayTabRemove';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';

configure({ adapter: new enzymeAdapterReact16() });

describe('AskAwayTabRemove Component', () => {
    // Snapshot Test Sample
    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTabRemove />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    // Component Test Sample
    it('should render the tab', () => {
        const component = shallow(<AskAwayTabRemove />);
        const divResult = component.containsMatchingElement(
            <Header content="You're about to remove your tab..." />
        );

        expect(divResult).toBeTruthy();
    });
});
