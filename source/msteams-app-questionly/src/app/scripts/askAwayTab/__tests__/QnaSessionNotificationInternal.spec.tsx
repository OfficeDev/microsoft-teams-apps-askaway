/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Flex, Text, Button, Form, Input, TextArea } from '@fluentui/react-northstar';
import Adapter from 'enzyme-adapter-react-16';
import QnaSessionNotificationInternal from '../popups/QnaSessionNotificationInternal';

configure({ adapter: new Adapter() });

describe('QnaSessionNotificationInternal Component', () => {
    const onSubmitSession = jest.fn();
    const searchParams = {} as URLSearchParams;

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
