/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Menu } from '@fluentui/react-northstar';
import Adapter from 'enzyme-adapter-react-16';
import TabHeader from '../../MeetingPanel/TabHeader';

configure({ adapter: new Adapter() });

describe('AskAwayTabRemove Component', () => {
    const t = jest.fn();
    const tabActiveIndex = 1;
    const onSelectActiveTab = jest.fn();
    it('should match the snapshot', () => {
        const wrapper = shallow(<TabHeader t={t} tabActiveIndex={tabActiveIndex} onSelectActiveTab={onSelectActiveTab} />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<TabHeader t={t} tabActiveIndex={tabActiveIndex} onSelectActiveTab={onSelectActiveTab} />);

        expect(component.find(Menu)).toBeTruthy();
    });
});
