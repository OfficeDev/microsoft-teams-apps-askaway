import { shallow, configure } from 'enzyme';
import * as React from 'react';
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import { SwitchSessionInternal } from '../../popups/switch-session/SwitchSessionInternal';
import SessionList from '../../popups/switch-session/SessionList';
import Adapter from 'enzyme-adapter-react-16';
import { Loader } from '@fluentui/react-northstar';

jest.mock('../../../telemetryService');
jest.mock('history');

configure({ adapter: new Adapter() });

describe('Test SwitchSessionInternal Component', () => {
    let testSessions: ClientDataContract.QnaSession[];

    beforeEach(() => {
        jest.clearAllMocks();

        (window.location as any) = {
            href: 'https://test.com?conversationId=1&selectedSessionId=sessionId1',
            search: 'abcdef',
        };

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

    it('should render correct number of session cards.', async () => {
        const wrapper = shallow(<SwitchSessionInternal showError={false} qnaSessions={testSessions} selectedSessionId={null} />);

        expect(wrapper.find(Loader)).toHaveLength(0);
        expect(wrapper.find(SessionList)).toHaveLength(1);
    });

    it('should render error of sessions fetch fail', async () => {
        const wrapper = shallow(<SwitchSessionInternal showError={true} qnaSessions={testSessions} selectedSessionId={null} />);

        expect(wrapper.find(Loader)).toHaveLength(0);
        expect(wrapper.find(SessionList)).toHaveLength(0);
        expect(wrapper.find('div#error')).toHaveLength(1);
    });

    it('should render loader', async () => {
        const wrapper = shallow(<SwitchSessionInternal showError={false} qnaSessions={null} selectedSessionId={null} />);

        expect(wrapper.find(Loader)).toHaveLength(1);
        expect(wrapper.find(SessionList)).toHaveLength(0);
        expect(wrapper.find('div#error')).toHaveLength(0);
    });
});
