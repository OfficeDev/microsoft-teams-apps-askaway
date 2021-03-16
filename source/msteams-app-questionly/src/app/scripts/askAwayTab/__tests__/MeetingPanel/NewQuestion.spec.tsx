/**
 * @jest-environment jsdom
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import NewQuestion from '../../MeetingPanel/NewQuestion';
import { Helper } from '../../shared/Helper';
import { Flex, Button, TextArea, FlexItem } from '@fluentui/react-northstar';
import { HttpService } from '../../shared/HttpService';

configure({ adapter: new enzymeAdapterReact16() });

describe('NewQuestion Component', () => {
    let httpServiceIns;
    let t;
    let activeSessionData;
    let onAddNewQuestion;

    beforeAll(() => {
        jest.mock('../../shared/HttpService');
        httpServiceIns = new HttpService();
        activeSessionData = new Helper().createEmptyActiveSessionData();
        onAddNewQuestion = jest.fn();
        t = jest.fn();
    });

    it('should match the snapshot', () => {
        const wrapper = shallow(
            <NewQuestion t={t} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} activeSessionData={activeSessionData} onAddNewQuestion={onAddNewQuestion} />
        );
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(
            <NewQuestion t={t} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} activeSessionData={activeSessionData} onAddNewQuestion={onAddNewQuestion} />
        );

        expect(component.find(Flex)).toHaveLength(1);
        expect(component.find(Button)).toHaveLength(1);
        expect(component.find(TextArea)).toHaveLength(1);
        expect(component.find(FlexItem)).toHaveLength(2);
    });
});
