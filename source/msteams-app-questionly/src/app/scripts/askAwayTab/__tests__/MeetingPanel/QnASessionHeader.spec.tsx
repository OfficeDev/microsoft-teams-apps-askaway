/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Flex, Text, FlexItem, Menu, menuAsToolbarBehavior, ShorthandCollection, MenuItemProps } from '@fluentui/react-northstar';
import Adapter from 'enzyme-adapter-react-16';
import QnASessionHeader from '../../MeetingPanel/QnASessionHeader';
import { ParticipantRoles } from '../../../../../enums/ParticipantRoles';

configure({ adapter: new Adapter() });

describe('AskAwayTabRemove Component', () => {
    const title = 'some-title';
    const t = jest.fn();
    const onClickRefreshSession = jest.fn();
    const onClickEndSession = jest.fn();

    it('should match the snapshot', () => {
        const userRole = ParticipantRoles.Presenter;
        const showToolBar = true;
        const wrapper = shallow(
            <QnASessionHeader t={t} title={title} onClickRefreshSession={onClickRefreshSession} onClickEndSession={onClickEndSession} userRole={userRole} showToolBar={showToolBar} />
        );
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the QnASessionHeader when showToolBar is false', () => {
        const userRole = ParticipantRoles.Presenter;
        const showToolBar = false;
        const component = shallow(
            <QnASessionHeader t={t} title={title} onClickRefreshSession={onClickRefreshSession} onClickEndSession={onClickEndSession} userRole={userRole} showToolBar={showToolBar} />
        );

        expect(component.find(Flex)).toHaveLength(1);
        expect(component.find(Text)).toHaveLength(1);
        expect(component.find(FlexItem)).toHaveLength(0);
    });

    it('should render the QnASessionHeader with menu when showToolBar is true', () => {
        const userRole = ParticipantRoles.Presenter;
        const showToolBar = true;
        const component = shallow(
            <QnASessionHeader t={t} title={title} onClickRefreshSession={onClickRefreshSession} onClickEndSession={onClickEndSession} userRole={userRole} showToolBar={showToolBar} />
        );

        expect(component.find(Flex)).toHaveLength(1);
        expect(component.find(Text)).toHaveLength(1);
        expect(component.find(FlexItem)).toHaveLength(1);
        expect(component.find(Menu)).toHaveLength(1);
    });
});
