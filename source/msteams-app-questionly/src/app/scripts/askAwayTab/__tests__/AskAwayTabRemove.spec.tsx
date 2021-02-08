/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Header } from '@fluentui/react-northstar';
import { AskAwayTabRemove } from '../AskAwayTabRemove';
import Adapter from 'enzyme-adapter-react-16';
import AskAwayTabRemoveInternal from '../AskAwayTabRemoveInternal';

configure({ adapter: new Adapter() });

describe('AskAwayTabRemove Component', () => {
    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTabRemove />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it.skip('should render the tab', () => {
        const component = shallow(<AskAwayTabRemove />);

        expect(component.find(AskAwayTabRemoveInternal)).toHaveLength(1);
    });
});
