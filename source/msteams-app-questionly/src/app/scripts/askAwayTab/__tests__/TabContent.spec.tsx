/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import toJson from 'enzyme-to-json';
import Adapter from 'enzyme-adapter-react-16';
import { TabContent } from '../TabContent';
import { telemetryService } from '../../telemetryService';
import { HttpService } from '../shared/HttpService';
import Helper from '../shared/Helper';
import { i18next } from '../shared/i18next';
import TabCreateSession from '../TabContent/TabCreateSession';
import PostNewQuestions from '../TabContent/PostNewQuestions';
import NoQuestionDesign from '../TabContent/NoQuestionDesign';
import TabQuestions from '../TabContent/TabQuestions';

configure({ adapter: new Adapter() });

describe('TabContent Component', () => {
    const httpServiceIns = new HttpService(telemetryService.appInsights);
    const t = jest.fn();
    const tReady = true;

    beforeAll(() => {
        jest.mock('../shared/HttpService');
    });

    afterAll(() => {
        jest.resetAllMocks();
    });

    it('should render TabCreateSession when there is no active session', () => {
        const component = shallow(
            <TabContent t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} appInsights={telemetryService.appInsights} helper={Helper} />
        );

        expect(component.find(TabCreateSession)).toHaveLength(1);
    });

    it('should render PostNewQuestions when there is an active session', () => {
        const component = shallow(
            <TabContent t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} appInsights={telemetryService.appInsights} helper={Helper} />
        );
        component.setState({
            activeSessionData: {
                sessionId: 'some-id',
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
        });

        expect(component.find(PostNewQuestions)).toHaveLength(1);
    });

    it('should render NoQuestionDesign when there is an active session and no questions', () => {
        const component = shallow(
            <TabContent t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} appInsights={telemetryService.appInsights} helper={Helper} />
        );
        component.setState({
            activeSessionData: {
                sessionId: 'some-id',
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
        });

        expect(component.find(NoQuestionDesign)).toHaveLength(1);
    });

    it('should render TabQuestions when there is an active session and have questions', () => {
        const component = shallow(
            <TabContent t={t} tReady={tReady} i18n={i18next} teamsTabContext={{ entityId: '', locale: '' }} httpService={httpServiceIns} appInsights={telemetryService.appInsights} helper={Helper} />
        );
        component.setState({
            activeSessionData: {
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
        });

        expect(component.find(PostNewQuestions)).toHaveLength(1);
        expect(component.find(TabQuestions)).toHaveLength(1);
    });
});
