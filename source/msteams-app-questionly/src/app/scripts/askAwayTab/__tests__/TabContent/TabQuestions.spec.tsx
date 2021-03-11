/**
 * @jest-environment jsdom
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { configure, shallow } from 'enzyme';
import { ThemePrepared } from '@fluentui/react-northstar';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import enzymeToJson from 'enzyme-to-json';
import * as React from 'react';
import { Helper } from '../../shared/Helper';
import { TabQuestions } from '../../TabContent/TabQuestions';

configure({ adapter: new enzymeAdapterReact16() });

describe('TabQuestions Component', () => {
    let onClickAction;
    let activeSessionData;
    let theme;
    let t;

    // Creates dummy color schemes for unit tests
    const createThemeForUTs = (): ThemePrepared => {
        return ({
            siteVariables: {
                colorScheme: {
                    default: {
                        background: '',
                        foreground1: '',
                    },
                    green: {
                        background: '',
                        foreground1: '',
                    },
                    onyx: {
                        border1: '',
                    },
                    brand: {
                        background: '',
                        foreground4: '',
                    },
                },
            },
        } as unknown) as ThemePrepared;
    };

    beforeAll(() => {
        t = jest.fn();
        activeSessionData = new Helper().createEmptyActiveSessionData();
        onClickAction = jest.fn();
        theme = createThemeForUTs();
    });

    it('should match the snapshot', () => {
        const wrapper = shallow(<TabQuestions t={t} theme={theme} activeSessionData={activeSessionData} onClickAction={onClickAction} teamsTabContext={{ entityId: '', locale: '' }} />);

        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the TabQuestions', () => {
        const component = shallow(<TabQuestions t={t} theme={theme} activeSessionData={activeSessionData} onClickAction={onClickAction} teamsTabContext={{ entityId: '', locale: '' }} />);
        console.log(component.debug());

        expect(component.find('div.question-container')).toBeTruthy();
    });
});
