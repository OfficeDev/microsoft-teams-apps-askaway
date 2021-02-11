import * as React from 'react';
import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web';
import { HttpService } from '../shared/HttpService';
import { IDataEvent } from 'msteams-app-questionly.common';
import ConnectionStatusAlert from './ConnectionStatusAlert';
import { TFunction } from 'i18next';

/**
 * SignalR connection status
 */
enum ConnectionStatus {
    /**
     * Connected - denotes a state where connection is successfully established.
     */
    Connected = 0,

    /**
     * NotConnected - denotes a state where connection is not established and connection is not being opened.
     */
    NotConnected = 1,

    /**
     * Connecting - denotes a state where connection is being opened for the first time.
     * We don't want to show warning to the user for connection state.
     */
    Connecting = 2,

    /**
     * Reconnecting - denotes a state where connection is being reopened.
     * We show warning to the user for reconnection state.
     */
    Reconnecting = 3,
}

/**
 * SignalR service connection limit options.
 */
enum ConnectionLimit {
    /**
     * Exhausted - denotes that signalR service connection limit is exhausted and no more connections can be opened.
     */
    Exhausted = 0,
    /**
     * NotExhausted - denotes that signalR service accepted the connection.
     */
    NotExhausted = 1,
}

export interface SignalRLifecycleProps {
    /**
     * TFunction to localize strings.
     */
    t: TFunction;

    /**
     * If real time updates are enabled.
     */
    enableLiveUpdates: boolean;

    /**
     * conversation id of the group chat.
     */
    conversationId?: string;

    /**
     * callback function from caller, which recives update on events.
     */
    onEvent: (dataEvent: IDataEvent) => void;

    /**
     * http service.
     */
    httpService: HttpService;

    /**
     * application insight client.
     */
    appInsights: ApplicationInsights;

    /**
     * signalR HubConnection for UTs only.
     */
    connection?: signalR.HubConnection;
}

/**
 * SignalR hub connection.
 */
let connection: signalR.HubConnection;

const SignalRLifecycle: React.FunctionComponent<SignalRLifecycleProps> = (props) => {
    const [connectionStatus, setConnectionStatus] = useState(ConnectionStatus.Connecting);
    const [connectionLimit, setConnectionLimit] = useState(ConnectionLimit.NotExhausted);

    /**
     * This function is triggered on events from signalR connection.
     * @param dataEvent - event received.
     */
    const onEvent = (dataEvent: any) => {
        props.onEvent(dataEvent);
    };

    /**
     * When signalR connection is closed and the client retries the connection,
     * this handler updates state accordingly.
     * @param error - error which closed the connection. signalR client passes error to `onreconnecting` callback.
     */
    const showAutoRefreshEstablishingMessage = (error?: Error) => {
        setConnectionStatus(ConnectionStatus.Reconnecting);
        props.appInsights.trackException({
            exception: error,
            severityLevel: SeverityLevel.Warning,
        });
    };

    /**
     * When signalR connection can not be established by the client,
     * this handler updates state accordingly.
     * @param error - error that occured while establishing connection. signalR client passes error to `onclose` callback.
     */
    const handleConnectionError = (error?: Error) => {
        setConnectionStatus(ConnectionStatus.NotConnected);

        if (error) {
            props.appInsights.trackException({
                exception: error,
                severityLevel: SeverityLevel.Error,
            });
        }
    };

    /**
     * Retries the connection if it's not alive already.
     */
    const refreshConnection = () => {
        if (connectionStatus !== ConnectionStatus.Connected) {
            initiateConnectionSetup();
        }
    };

    /**
     * Register callbacks for signalR connection life cycle events.
     */
    const registerCallbacksOnConnection = () => {
        connection.on('updateEvent', onEvent);
        connection.onclose(handleConnectionError);
        // `onreconnected` callback is called with new connection id.
        connection.onreconnected(addConnectionToGroup);
        connection.onreconnecting(showAutoRefreshEstablishingMessage);
    };

    /**
     * When `enableLiveUpdates` prop is changed, establish/ close connection.
     */
    useEffect(() => {
        if (props.enableLiveUpdates) {
            initiateConnectionSetup();
        } else {
            // `onclose` callback is called on `connection.stop`, hence no need to update state.
            connection?.stop();
        }
    }, [props.enableLiveUpdates]);

    /**
     * Adds connection to the meeting group.
     * @param connectionId - connection id.
     */
    const addConnectionToGroup = async (connectionId: string) => {
        const token = await props.httpService.getAuthToken();

        const addToGroupInputDate = {
            connectionId: connectionId,
            conversationId: props.conversationId,
        };

        const response = await axios.post(`${process.env.SignalRFunctionBaseUrl}/api/add-to-group?authorization=${token}`, addToGroupInputDate);

        if (response.status !== StatusCodes.OK) {
            props.appInsights.trackException({
                exception: new Error(`Error in adding connection to the group, conversationId: ${props.conversationId}, reason: ${response.statusText}`),
                severityLevel: SeverityLevel.Error,
            });

            handleConnectionError();
            return;
        }

        if (connectionStatus !== ConnectionStatus.Connected) {
            setConnectionStatus(ConnectionStatus.Connected);
        }
    };

    /**
     * Establishes connection with signalR service and adds client to meeting group.
     */
    const initiateConnectionSetup = async () => {
        try {
            setConnectionStatus(ConnectionStatus.Connecting);
            setConnectionLimit(ConnectionLimit.NotExhausted);

            const token = await props.httpService.getAuthToken();

            connection =
                props.connection ??
                new signalR.HubConnectionBuilder()
                    .withUrl(`${process.env.SignalRFunctionBaseUrl}/api?authorization=${token}`)
                    // Configures the signalr.HubConnection to automatically attempt to reconnect if the connection is lost.
                    // By default, the client will wait 0, 2, 10 and 30 seconds respectively before trying up to 4 reconnect attempts.
                    .withAutomaticReconnect()
                    .build();

            // Establish connection with signalR service.
            await connection.start();

            if (connection.connectionId !== null) {
                // Add client to the meeting group.
                await addConnectionToGroup(connection.connectionId);
            } else {
                throw new Error(`SignalR connection id is not resolved for conersationId: ${props.conversationId}`);
            }

            registerCallbacksOnConnection();
        } catch (error) {
            // SignalR connection limit is reached.
            if (error.statusCode === StatusCodes.TOO_MANY_REQUESTS) {
                setConnectionLimit(ConnectionLimit.Exhausted);

                // Too many connection can be logged as warning than error.
                props.appInsights.trackException({
                    exception: error,
                    severityLevel: SeverityLevel.Warning,
                });
            } else {
                props.appInsights.trackException({
                    exception: error,
                    severityLevel: SeverityLevel.Error,
                });
            }

            handleConnectionError();
        }
    };

    return (
        <div id="alertHolder">
            {props.enableLiveUpdates && (connectionStatus === ConnectionStatus.NotConnected || connectionStatus === ConnectionStatus.Reconnecting) && (
                <ConnectionStatusAlert t={props.t} onRefreshConnection={refreshConnection}></ConnectionStatusAlert>
            )}
        </div>
    );
};

export default SignalRLifecycle;
