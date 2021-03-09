/**
 * @jest-environment jsdom
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Button, Flex, Form, Input, Text, TextArea } from '@fluentui/react-northstar';
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import enzymeToJson from 'enzyme-to-json';
import * as React from 'react';
import CreateSessionInternal from '../popups/CreateSessionInternal';

configure({ adapter: new enzymeAdapterReact16() });
jest.mock('react-i18next', () => ({
    useTranslation: () => {
        return {
            t: (str) => str,
        };
    },
}));

describe('CreateSessionInternal Component', () => {
    let onSubmitCreateSession;

    afterAll(() => {
        jest.resetAllMocks();
        onSubmitCreateSession = jest.fn();
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
