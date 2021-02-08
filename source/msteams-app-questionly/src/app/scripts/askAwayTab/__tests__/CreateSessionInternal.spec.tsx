/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Flex, Text, Button, Form, Input, TextArea } from '@fluentui/react-northstar';
import Adapter from 'enzyme-adapter-react-16';
import CreateSessionInternal from '../popups/CreateSessionInternal';

configure({ adapter: new Adapter() });
jest.mock('react-i18next', () => ({
    useTranslation: () => {
        return {
            t: (str) => str,
        };
    },
}));

describe('CreateSessionInternal Component', () => {
    const onSubmitCreateSession = jest.fn();

    afterAll(() => {
        jest.resetAllMocks();
    });

    it('should match the snapshot', () => {
        const wrapper = shallow(<CreateSessionInternal onSubmitCreateSession={onSubmitCreateSession} />);

        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<CreateSessionInternal onSubmitCreateSession={onSubmitCreateSession} />);

        expect(component.find(Flex)).toHaveLength(2);
        expect(component.find(Form)).toHaveLength(1);
        expect(component.find(Text)).toHaveLength(2);
        expect(component.find(Input)).toHaveLength(1);
        expect(component.find(TextArea)).toHaveLength(1);
        expect(component.find(Button)).toHaveLength(1);
    });
});
