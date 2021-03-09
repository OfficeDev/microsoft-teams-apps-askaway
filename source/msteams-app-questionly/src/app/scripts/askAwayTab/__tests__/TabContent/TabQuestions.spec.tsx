/**
 * @jest-environment jsdom
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemePrepared } from '@fluentui/react-northstar';
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import enzymeToJson from 'enzyme-to-json';
import * as React from 'react';
import { Helper } from '../../shared/Helper';
import { TabQuestions } from '../../TabContent/TabQuestions';
import { themeMock } from '../mocks/themes';

configure({ adapter: new enzymeAdapterReact16() });

describe('TabQuestions Component', () => {
    let onClickAction;
    let activeSessionData;
    let theme;
    let t;

    beforeAll(() => {
        t = jest.fn();
        activeSessionData = new Helper().createEmptyActiveSessionData();
        onClickAction = jest.fn();
        theme = themeMock;
    });

    it('should match the snapshot', () => {
        const wrapper = shallow(<TabQuestions t={t} theme={theme} activeSessionData={activeSessionData} onClickAction={onClickAction} teamsTabContext={{ entityId: '', locale: '' }} />);

        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<TabQuestions t={t} theme={theme} activeSessionData={activeSessionData} onClickAction={onClickAction} teamsTabContext={{ entityId: '', locale: '' }} />);
        console.log(component.debug());

        expect(component.find('div.question-container')).toBeTruthy();
    });
});
