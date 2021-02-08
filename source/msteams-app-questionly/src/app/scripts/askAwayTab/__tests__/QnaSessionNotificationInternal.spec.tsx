/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Flex, Text, Button } from '@fluentui/react-northstar';
import Adapter from 'enzyme-adapter-react-16';
import QnaSessionNotificationInternal from '../popups/QnaSessionNotificationInternal';

configure({ adapter: new Adapter() });
jest.mock('react-i18next', () => ({
    useTranslation: () => {
        return {
            t: (str) => str,
        };
    },
}));

describe('QnaSessionNotificationInternal Component', () => {
    const onSubmitSession = jest.fn();
    const searchParams = {} as URLSearchParams;

    afterAll(() => {
        jest.resetAllMocks();
    });

    searchParams.get = jest.fn(() => 'some-value');
    it('should match the snapshot', () => {
        const wrapper = shallow(<QnaSessionNotificationInternal onSubmitSession={onSubmitSession} searchParams={searchParams} />);

        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<QnaSessionNotificationInternal onSubmitSession={onSubmitSession} searchParams={searchParams} />);

        expect(component.find(Flex)).toHaveLength(2);
        expect(component.find(Text)).toHaveLength(3);
        expect(component.find(Button)).toHaveLength(1);
    });
});
