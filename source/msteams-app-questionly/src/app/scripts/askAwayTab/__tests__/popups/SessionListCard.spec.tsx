import { shallow, configure } from 'enzyme';
import * as React from 'react';
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import SessionListCard from '../../popups/switch-session/SessionListCard';
import Adapter from 'enzyme-adapter-react-16';
import Badge from '../../shared/Badge';
import { Text } from '@fluentui/react-northstar';

configure({ adapter: new Adapter() });

describe('Test SessionListCard Component', () => {
    let testSession: ClientDataContract.QnaSession;

    beforeEach(() => {
        testSession = {
            title: 'test',
            isActive: false,
            dateTimeCreated: new Date(),
            answeredQuestions: [],
            unansweredQuestions: [],
            hostUser: { name: 'testName', id: 'testId' },
            sessionId: 'sessionId',
        };
    });

    it('should render fine for active session', () => {
        testSession.isActive = true;
        const provider = shallow(<SessionListCard t={jest.fn()} qnaSession={testSession} />);
        const wrapper = shallow(provider.props().render());

        // Make sure live tag is present.
        expect(wrapper.find(Badge)).toHaveLength(1);
        expect(wrapper.find(Text)).toHaveLength(2);
    });

    it('should render fine for closed session', () => {
        testSession.isActive = false;
        const provider = shallow(<SessionListCard t={jest.fn()} qnaSession={testSession} />);
        const wrapper = shallow(provider.props().render());

        expect(wrapper.find(Text)).toHaveLength(2);
        // Make sure live tag is not present.
        expect(wrapper.find(Badge)).toHaveLength(0);
    });
});
