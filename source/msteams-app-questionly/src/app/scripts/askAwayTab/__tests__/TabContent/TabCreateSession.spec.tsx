/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Flex, Text, Button, Image } from '@fluentui/react-northstar';
import Adapter from 'enzyme-adapter-react-16';
import TabCreateSession from '../../TabContent/TabCreateSession';

configure({ adapter: new Adapter() });

describe('TabCreateSession Component', () => {
    const t = jest.fn();
    const showTaskModule = jest.fn();
    it('should match the snapshot', () => {
        const wrapper = shallow(<TabCreateSession t={t} showTaskModule={showTaskModule} />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<TabCreateSession t={t} showTaskModule={showTaskModule} />);

        expect(component.find(Flex)).toHaveLength(1);
        expect(component.find(Image)).toHaveLength(1);
        expect(component.find(Text)).toHaveLength(2);
        expect(component.find(Button)).toHaveLength(1);
    });
});
