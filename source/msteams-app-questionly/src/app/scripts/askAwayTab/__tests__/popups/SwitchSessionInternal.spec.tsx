import { Loader } from '@fluentui/react-northstar';
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import * as React from 'react';
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import SessionList from '../../popups/switch-session/SessionList';
import { SwitchSessionInternal } from '../../popups/switch-session/SwitchSessionInternal';

jest.mock('../../../telemetryService');
jest.mock('history');

configure({ adapter: new enzymeAdapterReact16() });

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
                description: 'testDescription1',
                isActive: false,
                dateTimeCreated: new Date(),
                answeredQuestions: [],
                unansweredQuestions: [],
                hostUser: { name: 'testName', id: 'testId' },
                sessionId: 'sessionId',
            },
            {
                title: 'test',
                description: 'testDescription2',
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
