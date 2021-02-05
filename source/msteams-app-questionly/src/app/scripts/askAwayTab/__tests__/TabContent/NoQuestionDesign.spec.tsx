/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Image, Text, Flex } from '@fluentui/react-northstar';
import Adapter from 'enzyme-adapter-react-16';
import NoQuestionDesign from '../../TabContent/NoQuestionDesign';

configure({ adapter: new Adapter() });

describe('AskAwayTabRemove Component', () => {
    const t = jest.fn();

    it('should match the snapshot', () => {
        const wrapper = shallow(<NoQuestionDesign t={t} />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<NoQuestionDesign t={t} />);

        expect(component.find(Flex)).toHaveLength(1);
        expect(component.find(Image)).toHaveLength(1);
        expect(component.find(Text)).toHaveLength(1);
    });
});
