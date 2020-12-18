/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { SignalRLifecycle } from '../../signalR/SignalRLifecycle';
import Adapter from 'enzyme-adapter-react-16';
import { configure, shallow } from 'enzyme';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import { HubConnection } from '@microsoft/signalr';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { HttpService } from './../../shared/HttpService';

jest.mock('@microsoft/signalr');
jest.mock('axios');

configure({ adapter: new Adapter() });

describe('SignalRLifecycle Component', () => {
    const testConversationId = '1234';
    const updateEventCallback = jest.fn();
    let hubConnection: HubConnection;
    let sampleHttpService: HttpService;
    let sampleAppInsights: ApplicationInsights;

    beforeEach(() => {
        jest.clearAllMocks();
        const mockPostFunction = jest.fn();
        mockPostFunction.mockReturnValue(
            Promise.resolve({ status: StatusCodes.OK })
        );
        axios.post = mockPostFunction;
        sampleAppInsights = new ApplicationInsights({ config: {} });
        sampleAppInsights.trackException = jest.fn();
        sampleHttpService = new HttpService(sampleAppInsights);
        sampleHttpService.getAuthToken = jest.fn(() => {
            return Promise.resolve('testToken');
        });

        // tslint:disable-next-line
        hubConnection = ({
            start: jest.fn(() => {
                return Promise.resolve();
            }),
            connectionId: 'random',
            on: jest.fn(),
            onclose: jest.fn(),
            onreconnected: jest.fn(),
            onreconnecting: jest.fn(),
        } as unknown) as HubConnection;
    });

    const waitForAsync = () => new Promise((resolve) => setImmediate(resolve));

    it('should render fine with no errors', async () => {
        const wrapper = shallow(
            <SignalRLifecycle
                conversationId={testConversationId}
                updateEvent={updateEventCallback}
                appInsights={sampleAppInsights}
                httpService={sampleHttpService}
                connection={hubConnection}
            />
        );
        await waitForAsync();
        wrapper.update();
        expect(
            wrapper.containsMatchingElement(<div id="errorHolder" />)
        ).toBeTruthy();

        // No error screens should be shown.
        expect(wrapper.find('#errorHolder').children().length).toEqual(0);
    });

    it('should render retry button when connection can not be established', async () => {
        hubConnection.start = jest.fn(() => {
            return Promise.reject(new Error('new'));
        });

        const wrapper = shallow(
            <SignalRLifecycle
                conversationId={testConversationId}
                updateEvent={updateEventCallback}
                appInsights={sampleAppInsights}
                httpService={sampleHttpService}
                connection={hubConnection}
            />
        );
        await waitForAsync();
        wrapper.update();
        expect(wrapper.find('#errorHolder')).toBeDefined();

        // retry button should be shown.
        expect(wrapper.find('#errorHolder').children().length).toEqual(1);
        const children = wrapper.find('#errorHolder').children();
        expect(children.find('#connectionRetry')).toBeDefined();
    });

    it('should render retry button when connection is not resolved', async () => {
        // hub connection with null connection id.
        hubConnection = ({
            start: jest.fn(() => {
                return Promise.resolve();
            }),
            on: jest.fn(),
            connectionId: null,
            onclose: jest.fn(),
            onreconnected: jest.fn(),
            onreconnecting: jest.fn(),
        } as unknown) as HubConnection;

        const wrapper = shallow(
            <SignalRLifecycle
                conversationId={testConversationId}
                updateEvent={updateEventCallback}
                appInsights={sampleAppInsights}
                httpService={sampleHttpService}
                connection={hubConnection}
            />
        );
        await waitForAsync();
        wrapper.update();
        expect(wrapper.find('#errorHolder')).toBeDefined();

        // retry button should be shown.
        expect(wrapper.find('#errorHolder').children().length).toEqual(1);
        const children = wrapper.find('#errorHolder').children();
        expect(children.find('#connectionRetry')).toBeDefined();
    });

    it("should render retry button when connection can't be added to the meeting group", async () => {
        const mockPostFunction = jest.fn();
        mockPostFunction.mockReturnValue(
            Promise.resolve({ status: StatusCodes.INTERNAL_SERVER_ERROR })
        );
        axios.post = mockPostFunction;

        const wrapper = shallow(
            <SignalRLifecycle
                conversationId={testConversationId}
                updateEvent={updateEventCallback}
                appInsights={sampleAppInsights}
                httpService={sampleHttpService}
                connection={hubConnection}
            />
        );
        await waitForAsync();
        wrapper.update();
        expect(wrapper.find('#errorHolder')).toBeDefined();

        // retry button should be shown.
        expect(wrapper.find('#errorHolder').children().length).toEqual(1);
        const children = wrapper.find('#errorHolder').children();
        expect(children.find('#connectionRetry')).toBeDefined();
    });

    it('should render error with retry button on signalR connection limit reached', async () => {
        const testError = { statusCode: StatusCodes.TOO_MANY_REQUESTS };
        hubConnection.start = jest.fn(() => {
            return Promise.reject(testError);
        });

        const wrapper = shallow(
            <SignalRLifecycle
                conversationId={testConversationId}
                updateEvent={updateEventCallback}
                appInsights={sampleAppInsights}
                httpService={sampleHttpService}
                connection={hubConnection}
            />
        );
        await waitForAsync();
        wrapper.update();
        expect(wrapper.find('#errorHolder')).toBeDefined();

        expect(wrapper.find('#errorHolder').children().length).toEqual(2);
        const children = wrapper.find('#errorHolder').children();
        // Retry button should be shown.
        expect(children.find('#connectionRetry')).toBeDefined();
        // Connection limit reached error should be shown.
        expect(children.find('#connectionExhausted')).toBeDefined();
    });

    it('should retry connection and refresh ux on retry button click', async () => {
        hubConnection.start = jest.fn(() => {
            return Promise.reject(new Error());
        });

        const wrapper = shallow(
            <SignalRLifecycle
                conversationId={testConversationId}
                updateEvent={updateEventCallback}
                appInsights={sampleAppInsights}
                httpService={sampleHttpService}
                connection={hubConnection}
            />
        );
        await waitForAsync();
        wrapper.update();
        expect(wrapper.find('#errorHolder')).toBeDefined();

        expect(wrapper.find('#errorHolder').children().length).toEqual(1);
        const children = wrapper.find('#errorHolder').children();
        // Retry button should be shown.
        expect(children.find('#connectionRetry')).toBeDefined();

        hubConnection.start = jest.fn(() => {
            return Promise.resolve();
        });

        // Click on retry button.
        children.find('#connectionRetry').simulate('click');
        await waitForAsync();
        wrapper.update();

        // No error panels should be shown.
        expect(wrapper.find('#errorHolder').children().length).toEqual(0);
    });

    it('should fire updateEvent callback on events.', async () => {
        let updateFuncFromComponent = (data: any) => {};

        hubConnection.on = jest.fn(
            (methodName: string, newMethod: (data: any) => void) => {
                updateFuncFromComponent = newMethod;
            }
        );

        const wrapper = shallow(
            <SignalRLifecycle
                conversationId={testConversationId}
                updateEvent={updateEventCallback}
                appInsights={sampleAppInsights}
                httpService={sampleHttpService}
                connection={hubConnection}
            />
        );
        await waitForAsync();
        wrapper.update();

        expect(
            wrapper.containsMatchingElement(<div id="errorHolder" />)
        ).toBeTruthy();

        // No error panels should be shown.
        expect(wrapper.find('#errorHolder').children().length).toEqual(0);

        expect(hubConnection.on).toBeCalledTimes(1);

        // Sample event payload.
        const testData = {
            test: 'test',
        };

        // Trigger callback function registered for 'on' handler.
        updateFuncFromComponent(testData);
        expect(updateEventCallback).toBeCalledTimes(1);
        expect(updateEventCallback).toBeCalledWith(testData);

        // Make sure ux rendering is not affected.
        wrapper.update();
        expect(
            wrapper.containsMatchingElement(<div id="errorHolder" />)
        ).toBeTruthy();

        // No error screen should be shown.
        expect(wrapper.find('#errorHolder').children().length).toEqual(0);
    });

    it('should show retry option when connection is closed', async () => {
        let connectionCloseCallbackFromComponent = () => {};

        hubConnection.onclose = jest.fn((newMethod: () => void) => {
            connectionCloseCallbackFromComponent = newMethod;
        });

        const wrapper = shallow(
            <SignalRLifecycle
                conversationId={testConversationId}
                updateEvent={updateEventCallback}
                appInsights={sampleAppInsights}
                httpService={sampleHttpService}
                connection={hubConnection}
            />
        );
        await waitForAsync();
        wrapper.update();

        expect(
            wrapper.containsMatchingElement(<div id="errorHolder" />)
        ).toBeTruthy();

        // No error panels should be shown.
        expect(wrapper.find('#errorHolder').children().length).toEqual(0);

        expect(hubConnection.onclose).toBeCalledTimes(1);

        // Trigger onlcose callback.
        connectionCloseCallbackFromComponent();
        wrapper.update();

        // retry button should be shown.
        expect(wrapper.find('#errorHolder').children().length).toEqual(1);
        const children = wrapper.find('#errorHolder').children();
        expect(children.find('#connectionRetry')).toBeDefined();
    });

    it('should show no errors when connection is reconnecting', async () => {
        let connectionReconnectingCallbackFromComponent = () => {};

        hubConnection.onreconnecting = jest.fn((newMethod: () => void) => {
            connectionReconnectingCallbackFromComponent = newMethod;
        });

        const wrapper = shallow(
            <SignalRLifecycle
                conversationId={testConversationId}
                updateEvent={updateEventCallback}
                appInsights={sampleAppInsights}
                httpService={sampleHttpService}
                connection={hubConnection}
            />
        );
        await waitForAsync();
        wrapper.update();

        expect(
            wrapper.containsMatchingElement(<div id="errorHolder" />)
        ).toBeTruthy();

        // No error screens should be shown.
        expect(wrapper.find('#errorHolder').children().length).toEqual(0);

        expect(hubConnection.onclose).toBeCalledTimes(1);

        // Trigger onreconnecting callback.
        connectionReconnectingCallbackFromComponent();
        wrapper.update();

        // Reconnecting message should be shown.
        expect(wrapper.find('#errorHolder').children().length).toEqual(1);
        const children = wrapper.find('#errorHolder').children();
        expect(children.find('#reconnecting')).toBeDefined();
    });
});
