/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Flex, Button, Text, Avatar, ThemePrepared } from '@fluentui/react-northstar';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import { Question } from '../../MeetingPanel/Question';
import { ParticipantRoles } from '../../../../../enums/ParticipantRoles';

configure({ adapter: new enzymeAdapterReact16() });

describe('Question Component', () => {
    const question = {
        id: '',
        sessionId: '',
        content: '',
        dateTimeCreated: new Date(),
        isAnswered: false,
        author: { id: '', name: '' },
        votesCount: 0,
        voterAadObjectIds: [],
    };
    const isUserLikedQuestion = false;
    const renderHoverElement = null;
    const questionId = '';
    const questionTab = '';
    const userId = '';
    const userRole = ParticipantRoles.Presenter;
    let theme;
    let onClickAction;

    beforeAll(() => {
        onClickAction = jest.fn();
        theme = {} as ThemePrepared;
    });

    it('should match the snapshot', () => {
        const wrapper = shallow(
            <Question
                question={question}
                isUserLikedQuestion={isUserLikedQuestion}
                renderHoverElement={renderHoverElement}
                questionId={questionId}
                questionTab={questionTab}
                userId={userId}
                userRole={userRole}
                onClickAction={onClickAction}
                isSessionActive={true}
                theme={theme}
            />
        );
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(
            <Question
                question={question}
                isUserLikedQuestion={isUserLikedQuestion}
                renderHoverElement={renderHoverElement}
                questionId={questionId}
                questionTab={questionTab}
                userId={userId}
                userRole={userRole}
                onClickAction={onClickAction}
                isSessionActive={true}
                theme={theme}
            />
        );

        expect(component.find(Text)).toHaveLength(3);
        expect(component.find(Flex)).toHaveLength(3);
        expect(component.find(Avatar)).toHaveLength(1);
        expect(component.find(Button)).toHaveLength(2);
    });
});
