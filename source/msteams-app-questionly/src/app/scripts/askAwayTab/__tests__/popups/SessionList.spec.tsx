import { shallow, configure } from 'enzyme';
import * as React from 'react';
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import SessionList from '../../popups/switch-session/SessionList';
import Adapter from 'enzyme-adapter-react-16';
import { Button, List, ListProps } from '@fluentui/react-northstar';

configure({ adapter: new Adapter() });

describe('Test SessionList Component', () => {
    let testSessions: ClientDataContract.QnaSession[];

    beforeEach(() => {
        testSessions = [
            {
                title: 'test',
                isActive: false,
                dateTimeCreated: new Date(),
                answeredQuestions: [],
                unansweredQuestions: [],
                hostUser: { name: 'testName', id: 'testId' },
                sessionId: 'sessionId',
            },
            {
                title: 'test',
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
