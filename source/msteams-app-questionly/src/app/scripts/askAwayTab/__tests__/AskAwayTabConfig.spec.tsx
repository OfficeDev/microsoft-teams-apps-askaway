/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import { Text } from '@fluentui/react-northstar';
import toJson from 'enzyme-to-json';
import { AskAwayTabConfig } from '../AskAwayTabConfig';
import Adapter from 'enzyme-adapter-react-16';
import AskAwayTabConfigInternal from '../AskAwayTabConfigInternal';

configure({ adapter: new Adapter() });

describe('AskAwayTabConfig Component', () => {
    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTabConfig />);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it.skip('should render the tab', () => {
        const component = shallow(<AskAwayTabConfig />);

        expect(component.find(AskAwayTabConfigInternal)).toHaveLength(1);
    });
});
