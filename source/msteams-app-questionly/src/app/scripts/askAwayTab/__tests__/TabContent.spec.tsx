/**
 * @jest-environment jsdom
 */
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import * as React from 'react';
import { telemetryService } from '../../telemetryService';
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
    const tReady = true;

    beforeAll(() => {
        jest.mock('../shared/HttpService');
        httpServiceIns = new HttpService(telemetryService.appInsights);
        t = jest.fn();
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
