import * as React from 'react';
import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import * as microsoftTeams from '@microsoft/teams-js';
import { StatusCodes } from 'http-status-codes';
import { SeverityLevel } from '@microsoft/applicationinsights-web';
import { HttpService } from '../shared/HttpService';
import { IDataEvent } from 'msteams-app-questionly.common';
import ConnectionStatusAlert from './ConnectionStatusAlert';
import { TFunction } from 'i18next';
import { TelemetryEvents } from '../../../../constants/telemetryConstants';
import { trackEvent, trackException } from '../../telemetryService';

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
     * Current Teams context the frame is running in.
     */
    teamsTabContext: microsoftTeams.Context;

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
     * signalR HubConnection for UTs only.
     */
    connection?: signalR.HubConnection;

    /**
     *  __FOR_UTs_ONLY_ flag disabling trans 'react-i18next' component.
     */
    __disableTransComponent?: boolean;

    /**
     * Env variables
     */
    envConfig: { [key: string]: any };
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
    const onEvent = (dataEvent: IDataEvent) => {
        props.onEvent(dataEvent);

        trackEvent(TelemetryEvents.SignalREventReceived, {
            conversationId: props.conversationId,
            event: dataEvent,
            userAadObjectId: props.teamsTabContext?.userObjectId,
            meetingId: props.teamsTabContext?.meetingId,
        });
    };

    /**
     * When signalR connection is closed and the client retries the connection,
     * this handler updates state accordingly.
     * @param error - error which closed the connection. signalR client passes error to `onreconnecting` callback.
     */
    const showAutoRefreshEstablishingMessage = (error?: Error) => {
        setConnectionStatus(ConnectionStatus.Reconnecting);
        if (error) {
            trackException(error, SeverityLevel.Warning);
        }
    };

    /**
     * When signalR connection can not be established by the client,
     * this handler updates state accordingly.
     * @param error - error that occured while establishing connection. signalR client passes error to `onclose` callback.
     */
    const handleConnectionError = (error?: Error) => {
        // Putting this check to handle delayed callback, eg the active connection was stopped and then re-started.
        // `onclose` callback in only called when stop is called on active connection,
        // so we might not run into delayed callback as we restart the connection only if it is not active.
        if (connection?.state !== signalR.HubConnectionState.Connected) {
            setConnectionStatus(ConnectionStatus.NotConnected);

            if (error) {
                trackException(error, SeverityLevel.Error);
            }
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
        if (props.enableLiveUpdates && (!connection || connection.state !== signalR.HubConnectionState.Connected)) {
            initiateConnectionSetup();
        } else if (!props.enableLiveUpdates) {
            // `onclose` callback is called on `connection.stop`, hence no need to update state.
            connection?.stop();
        }
    }, [props.enableLiveUpdates]);

    /**
     * Adds connection to the meeting group.
     * @param connectionId - connection id.
     */
    const addConnectionToGroup = async (connectionId: string) => {
        const addToGroupInputDate = {
            connectionId: connectionId,
            conversationId: props.conversationId,
        };

        if (!props.envConfig.SignalRFunctionBaseUrl) {
            trackException(new Error('Error while calling /config API. Could not get SignalRFunctionBaseUrl'), SeverityLevel.Error);
            handleConnectionError();
            return;
        }

        const response = await props.httpService.post(`${props.envConfig.SignalRFunctionBaseUrl}/api/add-to-group`, addToGroupInputDate, false, undefined, false);

        if (response.status !== StatusCodes.OK) {
            trackException(new Error(`Error in adding connection to the group, conversationId: ${props.conversationId}, reason: ${response.statusText}`), SeverityLevel.Error);

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

            if (!props.envConfig.SignalRFunctionBaseUrl) {
                throw new Error('Error while calling /config API. Could not get SignalRFunctionBaseUrl');
            }

            if (!connection) {
                connection =
                    props.connection ??
                    new signalR.HubConnectionBuilder()
                        .withUrl(`${props.envConfig.SignalRFunctionBaseUrl}/api`, {
                            accessTokenFactory: async () => {
                                return await props.httpService.getAuthToken();
                            },
                        })
                        // Configures the signalr.HubConnection to automatically attempt to reconnect if the connection is lost.
                        // By default, the client will wait 0, 2, 10 and 30 seconds respectively before trying up to 4 reconnect attempts.
                        .withAutomaticReconnect()
                        .build();

                registerCallbacksOnConnection();
            } else {
                // Stops existing connection so that new connection can be established.
                await connection.stop();
            }

            // Establish connection with signalR service.
            await connection.start();

            if (connection.connectionId !== null) {
                // Add client to the meeting group.
                await addConnectionToGroup(connection.connectionId);
            } else {
                throw new Error(`SignalR connection id is not resolved for conersationId: ${props.conversationId}`);
            }
        } catch (error) {
            // SignalR connection limit is reached.
            if (error.statusCode === StatusCodes.TOO_MANY_REQUESTS) {
                setConnectionLimit(ConnectionLimit.Exhausted);

                // Too many connection can be logged as warning than error.
                trackException(error, SeverityLevel.Warning);
            } else {
                trackException(error, SeverityLevel.Error);
            }

            handleConnectionError();
        }
    };

    return (
        <div id="alertHolder">
            {props.enableLiveUpdates && (connectionStatus === ConnectionStatus.NotConnected || connectionStatus === ConnectionStatus.Reconnecting) && (
                <ConnectionStatusAlert __disableTransComponent={props.__disableTransComponent} t={props.t} onRefreshConnection={refreshConnection}></ConnectionStatusAlert>
            )}
        </div>
    );
};

export default SignalRLifecycle;
