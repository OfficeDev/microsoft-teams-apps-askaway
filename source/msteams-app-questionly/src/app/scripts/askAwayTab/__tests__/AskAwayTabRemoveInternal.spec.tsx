/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Flex, Text, Header } from '@fluentui/react-northstar';
import Adapter from 'enzyme-adapter-react-16';
import AskAwayTabRemoveInternal from '../AskAwayTabRemoveInternal';

configure({ adapter: new Adapter() });
jest.mock('react-i18next', () => ({
    useTranslation: () => {
        return {
            t: (str) => str,
        };
    },
}));

describe('AskAwayTabRemoveInternal Component', () => {
    afterAll(() => {
        jest.resetAllMocks();
    });

    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTabRemoveInternal />);

        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<AskAwayTabRemoveInternal />);

        expect(component.find(Flex)).toHaveLength(1);
        expect(component.find(Text)).toHaveLength(1);
        expect(component.find(Header)).toHaveLength(1);
    });
});
