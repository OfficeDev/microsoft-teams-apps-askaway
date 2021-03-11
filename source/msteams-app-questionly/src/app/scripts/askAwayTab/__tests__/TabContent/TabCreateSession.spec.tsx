/**
 * @jest-environment jsdom
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Flex, Text, Button, Image } from '@fluentui/react-northstar';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import TabCreateSession from '../../TabContent/TabCreateSession';
import { ParticipantRoles } from '../../../../../enums/ParticipantRoles';

configure({ adapter: new enzymeAdapterReact16() });

describe('TabCreateSession Component', () => {
    let t;
    let showTaskModule;

    beforeAll(() => {
        t = jest.fn();
        showTaskModule = jest.fn();
    });

    it('should match the snapshot', () => {
        const userRole = ParticipantRoles.Presenter;
        const wrapper = shallow(<TabCreateSession t={t} showTaskModule={showTaskModule} userRole={userRole} />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const userRole = ParticipantRoles.Presenter;
        const component = shallow(<TabCreateSession t={t} showTaskModule={showTaskModule} userRole={userRole} />);

        expect(component.find(Flex)).toHaveLength(1);
        expect(component.find(Image)).toHaveLength(1);
        expect(component.find(Text)).toHaveLength(2);
        expect(component.find(Button)).toHaveLength(1);
    });
});
