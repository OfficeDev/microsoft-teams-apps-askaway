/**
 * @jest-environment jsdom
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Button, List, ListProps } from '@fluentui/react-northstar';
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import * as React from 'react';
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import SessionList from '../../popups/switch-session/SessionList';

configure({ adapter: new enzymeAdapterReact16() });

describe('Test SessionList Component', () => {
    let testSessions: ClientDataContract.QnaSession[];

    beforeEach(() => {
        testSessions = [
            {
                title: 'test',
                description: 'testDescription1',
                isActive: false,
                dateTimeCreated: new Date(),
                answeredQuestions: [],
                unansweredQuestions: [],
                hostUser: { name: 'testName', id: 'testId' },
                sessionId: 'sessionId',
            },
            {
                title: 'testDescription2',
                description: 'test',
                isActive: false,
                dateTimeCreated: new Date(),
                answeredQuestions: [],
                unansweredQuestions: [],
                hostUser: { name: 'testName', id: 'testId' },
                sessionId: 'sessionId1',
            },
        ];
    });

    it('should render correct number of session cards.', () => {
        const wrapper = shallow(<SessionList t={jest.fn()} selectedSessionIndex={0} qnaSessions={testSessions} />);
        expect(wrapper.find(Button)).toHaveLength(2);

        // Make correct number of session cards are rendered..
        expect(wrapper.find(List)).toHaveLength(1);
        expect((wrapper.find(List).props() as ListProps)?.items?.length).toBe(testSessions.length);
    });

    it('should render error when no active sessions.', () => {
        const wrapper = shallow(<SessionList t={jest.fn()} selectedSessionIndex={-1} qnaSessions={[]} />);
        expect(wrapper.find('div.centerContent')).toHaveLength(1);
        // Make sure button is not visible
        expect(wrapper.find(Button)).toHaveLength(0);
    });
});
