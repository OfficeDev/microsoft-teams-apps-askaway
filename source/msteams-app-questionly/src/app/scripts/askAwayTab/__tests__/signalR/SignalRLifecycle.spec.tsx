/**
 * @jest-environment jsdom
 */
import { HubConnection } from '@microsoft/signalr';
import axios from 'axios';
import { configure, mount } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import { StatusCodes } from 'http-status-codes';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import ConnectionStatusAlert from '../../signalR/ConnectionStatusAlert';
import SignalRLifecycle from '../../signalR/SignalRLifecycle';
import { HttpService } from './../../shared/HttpService';

jest.mock('@microsoft/signalr');
jest.mock('axios');

configure({ adapter: new enzymeAdapterReact16() });

describe('SignalRLifecycle Component', () => {
    const testConversationId = '1234';
    let updateEventCallback;
    let hubConnection: HubConnection;
    let sampleHttpService: HttpService;
    let envConfig: { [key: string]: any };
    let t: jest.Mock<any, any>;

    beforeAll(() => {
        t = jest.fn();
        updateEventCallback = jest.fn();
        t.mockImplementation((key: string) => {
            return key;
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();
        const mockPostFunction = jest.fn();
        mockPostFunction.mockReturnValue(Promise.resolve({ status: StatusCodes.OK }));
        axios.post = mockPostFunction;
        const mockGetFunction = jest.fn();
        mockGetFunction.mockReturnValue(Promise.resolve({ status: StatusCodes.OK, data: 'random' }));
        axios.get = mockGetFunction;
        sampleHttpService = new HttpService();
        sampleHttpService.getAuthToken = jest.fn(() => {
            return Promise.resolve('testToken');
        });
        envConfig = {
            SignalRFunctionBaseUrl: 'random',
        };

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

    it('should render fine with no alert', async () => {
        let wrapper = mount(
            <SignalRLifecycle
                t={t}
                enableLiveUpdates={true}
                conversationId={testConversationId}
                onEvent={updateEventCallback}
                httpService={sampleHttpService}
                connection={hubConnection}
                __disableTransComponent={true}
                envConfig={envConfig}
                teamsTabContext={{ entityId: '', locale: '' }}
            />
        );
        await act(async () => {
            await Promise.resolve(wrapper);
            await waitForAsync();
            wrapper.update();
        });

        expect(wrapper.containsMatchingElement(<div id="alertHolder" />)).toBeTruthy();

        // No alert should be shown.
        expect(wrapper.find(ConnectionStatusAlert)).toHaveLength(0);
    });

    it('should render alert when connection can not be established', async () => {
        hubConnection.start = jest.fn(() => {
            return Promise.reject(new Error('new'));
        });

        let wrapper = mount(
            <SignalRLifecycle
                t={t}
                enableLiveUpdates={true}
                conversationId={testConversationId}
                onEvent={updateEventCallback}
                httpService={sampleHttpService}
                connection={hubConnection}
                __disableTransComponent={true}
                envConfig={envConfig}
                teamsTabContext={{ entityId: '', locale: '' }}
            />
        );
        await act(async () => {
            await Promise.resolve(wrapper);
            await waitForAsync();
            wrapper.update();
        });

        expect(wrapper.find('#alertHolder')).toBeDefined();

        // alert should be shown.
        expect(wrapper.find(ConnectionStatusAlert)).toHaveLength(1);
    });

    it('should render alert when connection is not resolved', async () => {
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

        let wrapper = mount(
            <SignalRLifecycle
                t={t}
                enableLiveUpdates={true}
                conversationId={testConversationId}
                onEvent={updateEventCallback}
                httpService={sampleHttpService}
                connection={hubConnection}
                __disableTransComponent={true}
                envConfig={envConfig}
                teamsTabContext={{ entityId: '', locale: '' }}
            />
        );
        await act(async () => {
            await Promise.resolve(wrapper);
            await waitForAsync();
            wrapper.update();
        });

        expect(wrapper.find('#alertHolder')).toBeDefined();

        // alert should be shown.
        expect(wrapper.find(ConnectionStatusAlert)).toHaveLength(1);
    });

    it("should render alert when connection can't be added to the meeting group", async () => {
        const mockPostFunction = jest.fn();
        mockPostFunction.mockReturnValue(Promise.resolve({ status: StatusCodes.INTERNAL_SERVER_ERROR }));
        axios.post = mockPostFunction;

        let wrapper = mount(
            <SignalRLifecycle
                t={t}
                enableLiveUpdates={true}
                conversationId={testConversationId}
                onEvent={updateEventCallback}
                httpService={sampleHttpService}
                connection={hubConnection}
                __disableTransComponent={true}
                envConfig={envConfig}
                teamsTabContext={{ entityId: '', locale: '' }}
            />
        );
        await act(async () => {
            await Promise.resolve(wrapper);
            await waitForAsync();
            wrapper.update();
        });

        expect(wrapper.find('#alertHolder')).toHaveLength(1);

        // alert should be shown.
        expect(wrapper.find(ConnectionStatusAlert)).toHaveLength(1);
    });

    it('should render alert on signalR connection limit reached', async () => {
        const testError = { statusCode: StatusCodes.TOO_MANY_REQUESTS };
        hubConnection.start = jest.fn(() => {
            return Promise.reject(testError);
        });

        let wrapper = mount(
            <SignalRLifecycle
                t={t}
                enableLiveUpdates={true}
                conversationId={testConversationId}
                onEvent={updateEventCallback}
                httpService={sampleHttpService}
                connection={hubConnection}
                __disableTransComponent={true}
                envConfig={envConfig}
                teamsTabContext={{ entityId: '', locale: '' }}
            />
        );
        await act(async () => {
            await Promise.resolve(wrapper);
            await waitForAsync();
            wrapper.update();
        });

        expect(wrapper.find('#alertHolder')).toHaveLength(1);

        // alert should be shown.
        expect(wrapper.find(ConnectionStatusAlert)).toHaveLength(1);
    });

    it('should fire updateEvent callback on events.', async () => {
        let updateFuncFromComponent = (data: any) => {};

        hubConnection.on = jest.fn((methodName: string, newMethod: (data: any) => void) => {
            updateFuncFromComponent = newMethod;
        });

        let wrapper = mount(
            <SignalRLifecycle
                t={t}
                enableLiveUpdates={true}
                conversationId={testConversationId}
                onEvent={updateEventCallback}
                httpService={sampleHttpService}
                connection={hubConnection}
                __disableTransComponent={true}
                envConfig={envConfig}
                teamsTabContext={{ entityId: '', locale: '' }}
            />
        );
        await act(async () => {
            await Promise.resolve(wrapper);
            await waitForAsync();
            wrapper.update();
        });

        expect(wrapper.containsMatchingElement(<div id="alertHolder" />)).toBeTruthy();

        // No alert should be shown.
        expect(wrapper.find(ConnectionStatusAlert)).toHaveLength(0);

        expect(hubConnection.on).toBeCalledTimes(1);

        // Sample event payload.
        const testData = {
            test: 'test',
        };

        await act(async () => {
            // Trigger callback function registered for 'on' handler.
            updateFuncFromComponent(testData);
            // Make sure ux rendering is not affected.
            wrapper.update();
        });

        expect(updateEventCallback).toBeCalledTimes(1);
        expect(updateEventCallback).toBeCalledWith(testData);

        expect(wrapper.containsMatchingElement(<div id="alertHolder" />)).toBeTruthy();

        // No alert should be shown.
        expect(wrapper.find(ConnectionStatusAlert)).toHaveLength(0);
    });

    it('should show alert when connection is closed', async () => {
        let connectionCloseCallbackFromComponent = () => {};

        hubConnection.onclose = jest.fn((newMethod: () => void) => {
            connectionCloseCallbackFromComponent = newMethod;
        });

        let wrapper = mount(
            <SignalRLifecycle
                t={t}
                enableLiveUpdates={true}
                conversationId={testConversationId}
                onEvent={updateEventCallback}
                httpService={sampleHttpService}
                connection={hubConnection}
                __disableTransComponent={true}
                envConfig={envConfig}
                teamsTabContext={{ entityId: '', locale: '' }}
            />
        );
        await act(async () => {
            await Promise.resolve(wrapper);
            await waitForAsync();
            wrapper.update();
        });

        expect(wrapper.containsMatchingElement(<div id="alertHolder" />)).toBeTruthy();

        // No alert should be shown.
        expect(wrapper.find(ConnectionStatusAlert)).toHaveLength(0);

        expect(hubConnection.onclose).toBeCalledTimes(1);

        await act(async () => {
            // Trigger onlcose callback.
            await connectionCloseCallbackFromComponent();
            wrapper.update();
        });

        // alert should be shown.
        expect(wrapper.find(ConnectionStatusAlert)).toHaveLength(1);
    });

    it('should alert when connection is reconnecting', async () => {
        let connectionReconnectingCallbackFromComponent = () => {};

        hubConnection.onreconnecting = jest.fn((newMethod: () => void) => {
            connectionReconnectingCallbackFromComponent = newMethod;
        });

        let wrapper = mount(
            <SignalRLifecycle
                t={t}
                enableLiveUpdates={true}
                conversationId={testConversationId}
                onEvent={updateEventCallback}
                httpService={sampleHttpService}
                connection={hubConnection}
                __disableTransComponent={true}
                envConfig={envConfig}
                teamsTabContext={{ entityId: '', locale: '' }}
            />
        );
        await act(async () => {
            await Promise.resolve(wrapper);
            await waitForAsync();
            wrapper.update();
        });

        expect(wrapper.containsMatchingElement(<div id="alertHolder" />)).toBeTruthy();

        // No alert should be shown.
        expect(wrapper.find(ConnectionStatusAlert)).toHaveLength(0);

        expect(hubConnection.onclose).toBeCalledTimes(1);

        await act(async () => {
            // Trigger onreconnecting callback.
            await connectionReconnectingCallbackFromComponent();
            wrapper.update();
        });

        // alert should be shown.
        expect(wrapper.find(ConnectionStatusAlert)).toHaveLength(1);
    });
});
