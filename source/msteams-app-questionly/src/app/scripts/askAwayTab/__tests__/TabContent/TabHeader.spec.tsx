/**
 * @jest-environment jsdom
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AddIcon, RetryIcon } from '@fluentui/react-icons-northstar';
import { Button, Divider, Flex } from '@fluentui/react-northstar';
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import enzymeToJson from 'enzyme-to-json';
import * as React from 'react';
import { ParticipantRoles } from '../../../../../enums/ParticipantRoles';
import { Helper } from '../../shared/Helper';
import { SwitchIcon } from '../../shared/Icons/SwitchIcon';
import TabHeader from '../../TabContent/TabHeader';

configure({ adapter: new enzymeAdapterReact16() });

describe('TabHeader Component', () => {
    let activeSessionData;
    let refreshSession;
    let t;
    let endSession;
    let showTaskModule;
    let onSwitchSessionClick;

    beforeAll(() => {
        t = jest.fn();
        activeSessionData = new Helper().createEmptyActiveSessionData();
        refreshSession = jest.fn();
        endSession = jest.fn();
        showTaskModule = jest.fn();
        onSwitchSessionClick = jest.fn();
    });

    it('should match the snapshot', () => {
        const userRole = ParticipantRoles.Presenter;
        const wrapper = shallow(
            <TabHeader
                t={t}
                refreshSession={refreshSession}
                endSession={endSession}
                showTaskModule={showTaskModule}
                activeSessionData={activeSessionData}
                userRole={userRole}
                disableActions={true}
                onSwitchSessionClick={onSwitchSessionClick}
            />
        );
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const userRole = ParticipantRoles.Presenter;
        const component = shallow(
            <TabHeader
                t={t}
                refreshSession={refreshSession}
                endSession={endSession}
                showTaskModule={showTaskModule}
                activeSessionData={activeSessionData}
                userRole={userRole}
                disableActions={true}
                onSwitchSessionClick={onSwitchSessionClick}
            />
        );

        expect(component.find(Flex)).toHaveLength(1);
        expect(component.find(Divider)).toHaveLength(1);
        expect(component.find(Button)).toHaveLength(3);
        expect(component.find(AddIcon)).toHaveLength(1);
        expect(component.find(RetryIcon)).toHaveLength(1);
        expect(component.find(SwitchIcon)).toHaveLength(1);
    });
});
