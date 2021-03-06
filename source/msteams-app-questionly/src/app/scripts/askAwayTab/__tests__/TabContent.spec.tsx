/**
 * @jest-environment jsdom
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import * as React from 'react';
import { ParticipantRoles } from '../../../../enums/ParticipantRoles';
import Helper from '../shared/Helper';
import { HttpService } from '../shared/HttpService';
import { i18next } from '../shared/i18next';
import { TabContent } from '../TabContent';
import NoQuestionDesign from '../TabContent/NoQuestionDesign';
import PostNewQuestions from '../TabContent/PostNewQuestions';
import TabCreateSession from '../TabContent/TabCreateSession';
import TabQuestions from '../TabContent/TabQuestions';

configure({ adapter: new enzymeAdapterReact16() });

describe('TabContent Component', () => {
    let httpServiceIns;
    let t;
    let envConfig: { [key: string]: any };
    const tReady = true;

    beforeAll(() => {
        jest.mock('../shared/HttpService');
        httpServiceIns = new HttpService();
        t = jest.fn();
        envConfig = {};
    });

    afterAll(() => {
        jest.resetAllMocks();
    });

    it('should render TabCreateSession when there is no active session', () => {
        const component = shallow(
            <TabContent t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} helper={Helper} envConfig={envConfig} />
        );

        component.setState({
            selectedAmaSessionData: {
                sessionId: '',
                title: '',
                isActive: false,
                dateTimeCreated: new Date(),
                hostUser: {
                    id: '',
                    name: '',
                },
                answeredQuestions: [],
                unansweredQuestions: [],
            },
            userRole: ParticipantRoles.Attendee,
            userName: '',
            showLoader: false,
            showNewUpdatesButton: false,
        });

        expect(component.find(TabCreateSession)).toHaveLength(1);
    });

    it('should render PostNewQuestions and NoQuestionDesign when there is an active session', () => {
        const component = shallow(
            <TabContent t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} helper={Helper} envConfig={envConfig} />
        );
        component.setState({
            selectedAmaSessionData: {
                sessionId: 'some-id',
                title: '',
                isActive: true,
                dateTimeCreated: new Date(),
                hostUser: {
                    id: '',
                    name: '',
                },
                answeredQuestions: [],
                unansweredQuestions: [],
            },
            userRole: ParticipantRoles.Attendee,
            userName: '',
            showLoader: false,
            showNewUpdatesButton: false,
        });

        expect(component.find(PostNewQuestions)).toHaveLength(1);
        expect(component.find(NoQuestionDesign)).toHaveLength(1);
    });

    it('should render TabQuestions when there is an active session and have questions', () => {
        const component = shallow(
            <TabContent t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} helper={Helper} envConfig={envConfig} />
        );
        component.setState({
            selectedAmaSessionData: {
                sessionId: 'some-id',
                title: '',
                isActive: false,
                dateTimeCreated: new Date(),
                hostUser: {
                    id: '',
                    name: '',
                },
                answeredQuestions: [{ id: '123' }],
                unansweredQuestions: [{ id: '456' }],
            },
            userRole: ParticipantRoles.Attendee,
            userName: '',
            showLoader: false,
            showNewUpdatesButton: false,
        });

        expect(component.find(PostNewQuestions)).toHaveLength(1);
        expect(component.find(TabQuestions)).toHaveLength(1);
    });
});
