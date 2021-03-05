/**
 * @jest-environment jsdom
 */

import { Flex, Image, Text } from '@fluentui/react-northstar';
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import enzymeToJson from 'enzyme-to-json';
import * as React from 'react';
import AskAwayTabConfigInternal from '../AskAwayTabConfigInternal';

configure({ adapter: new enzymeAdapterReact16() });
jest.mock('react-i18next', () => ({
    useTranslation: () => {
        return {
            t: (str) => str,
        };
    },
}));

describe('AskAwayTabConfigInternal Component', () => {
    afterAll(() => {
        jest.resetAllMocks();
    });

    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTabConfigInternal />);

        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<AskAwayTabConfigInternal />);

        expect(component.find(Flex)).toHaveLength(1);
        expect(component.find(Text)).toHaveLength(1);
        expect(component.find(Image)).toHaveLength(1);
    });
});
