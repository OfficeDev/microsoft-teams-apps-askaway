/**
 * @jest-environment jsdom
 */

import { Button, Flex, Text } from '@fluentui/react-northstar';
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import enzymeToJson from 'enzyme-to-json';
import * as React from 'react';
import QnaSessionNotificationInternal from '../popups/QnaSessionNotificationInternal';

configure({ adapter: new enzymeAdapterReact16() });
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

        expect(component.find(Flex)).toHaveLength(1);
        expect(component.find(Text)).toHaveLength(3);
        expect(component.find(Button)).toHaveLength(1);
    });
});
