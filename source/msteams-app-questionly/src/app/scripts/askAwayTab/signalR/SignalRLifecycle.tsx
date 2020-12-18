import * as React from 'react';
import * as signalR from '@microsoft/signalr';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import {
    ApplicationInsights,
    SeverityLevel,
} from '@microsoft/applicationinsights-web';
import { HttpService } from './../shared/HttpService';

/**
 * signalR connection status
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
 * signalR service connection limit options.
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
     * conversation id of the group chat.
     */
    conversationId: string;

    /**
     * callback function from caller, which recives update on events.
     */
    updateEvent: (dataEvent: any) => void;

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

export interface SignalRLifecycleState {
    /**
     * State variable to track signalR connection status
     */
    connectionStatus: ConnectionStatus;

    /**
     * State variable denoting whether signalR max connection limit is reached.
     */
    connectionLimit: ConnectionLimit;
}

export class SignalRLifecycle extends React.Component<
    SignalRLifecycleProps,
    SignalRLifecycleState
> {
    /**
     * signalR hub connection.
     */
    private connection: signalR.HubConnection;

    constructor(props: Readonly<SignalRLifecycleProps>) {
        super(props);
        this.state = {
            connectionStatus: ConnectionStatus.Connecting,
            connectionLimit: ConnectionLimit.NotExhausted,
        };
    }

    componentDidMount() {
        this.initiateConnectionSetup();
    }

    /**
     * Register callbacks for signalR connection life cycle events.
     */
    private registerCallbacksOnConnection() {
        this.connection.on('updateEvent', this.updateEvent.bind(this));
        this.connection.onclose(this.handleConnectionError.bind(this));
        // `onreconnected` callback is called with new connection id.
        this.connection.onreconnected(this.addConnectionToGroup.bind(this));
        this.connection.onreconnecting(
            this.showAutoRefreshEstablishingMessage.bind(this)
        );
    }

    /**
     * Establishes connection with signalR service and adds client to meeting group.
     */
    private async initiateConnectionSetup() {
        try {
            this.setState({
                connectionLimit: ConnectionLimit.NotExhausted,
                connectionStatus: ConnectionStatus.Connecting,
            });

            const token = await this.props.httpService.getAuthToken();

            this.connection =
                this.props.connection ??
                new signalR.HubConnectionBuilder()
                    .withUrl(
                        `${process.env.SignalRFunctionBaseUrl}/api?authorization=${token}`
                    )
                    // Configures the signalr.HubConnection to automatically attempt to reconnect if the connection is lost.
                    // By default, the client will wait 0, 2, 10 and 30 seconds respectively before trying up to 4 reconnect attempts.
                    .withAutomaticReconnect()
                    .build();

            // Establish connection with signalR service.
            await this.connection.start();

            if (this.connection.connectionId !== null) {
                // Add client to the meeting group.
                await this.addConnectionToGroup(this.connection.connectionId);
            } else {
                throw new Error(
                    `SignalR connection id is not resolved for conersationId: ${this.props.conversationId}`
                );
            }

            this.registerCallbacksOnConnection();
        } catch (error) {
            // SignalR connection limit is reached.
            if (error.statusCode === StatusCodes.TOO_MANY_REQUESTS) {
                this.setState({ connectionLimit: ConnectionLimit.Exhausted });

                // Too many connection can be logged as warning than error.
                this.props.appInsights.trackException({
                    exception: error,
                    severityLevel: SeverityLevel.Warning,
                });
            } else {
                this.props.appInsights.trackException({
                    exception: error,
                    severityLevel: SeverityLevel.Error,
                });
            }

            this.handleConnectionError();
        }
    }

    /**
     * This function is triggered on events from signalR connection.
     * @param dataEvent - event received.
     */
    private updateEvent = (dataEvent: any) => {
        this.props.updateEvent(dataEvent);
    };

    /**
     * When signalR connection is closed and the client retries the connection,
     * this handler shows proper error message to user.
     * @param error - error which closed the connection. signalR client passes error to `onreconnecting` callback.
     */
    private showAutoRefreshEstablishingMessage(error?: Error) {
        this.setState({
            connectionStatus: ConnectionStatus.Reconnecting,
        });

        this.props.appInsights.trackException({
            exception: error,
            severityLevel: SeverityLevel.Warning,
        });
    }

    /**
     * Adds connection to the meeting group.
     * @param connectionId - connection id.
     */
    private async addConnectionToGroup(connectionId: string) {
        const token = await this.props.httpService.getAuthToken();

        const addToGroupInputDate = {
            connectionId: connectionId,
            conversationId: this.props.conversationId,
        };

        const response = await axios.post(
            `${process.env.SignalRFunctionBaseUrl}/api/add-to-group?authorization=${token}`,
            addToGroupInputDate
        );

        if (response.status !== StatusCodes.OK) {
            this.props.appInsights.trackException({
                exception: new Error(
                    `Error in adding connection to the group, conversationId: ${this.props.conversationId}, reason: ${response.statusText}`
                ),
                severityLevel: SeverityLevel.Error,
            });

            this.handleConnectionError();
            return;
        }

        if (this.state.connectionStatus !== ConnectionStatus.Connected) {
            this.setState({ connectionStatus: ConnectionStatus.Connected });
        }
    }

    /**
     * When signalR connectios can not be established by the client,
     * this handler shows manual retry option to the user.
     * @param error - error that occured while establishing connection. signalR client passes error to `onclose` callback.
     */
    private handleConnectionError(error?: Error) {
        this.setState({ connectionStatus: ConnectionStatus.NotConnected });

        if (error) {
            this.props.appInsights.trackException({
                exception: error,
                severityLevel: SeverityLevel.Error,
            });
        }
    }

    public render() {
        // These are temporary placeholders for error scenarios.
        return (
            <div id="errorHolder">
                {this.state.connectionStatus ===
                    ConnectionStatus.NotConnected && (
                    <button
                        id="connectionRetry"
                        onClick={this.initiateConnectionSetup.bind(this)}
                    >
                        retry
                    </button>
                )}
                {this.state.connectionStatus ===
                    ConnectionStatus.Reconnecting && (
                    <h1 id="reconnecting">
                        Auto refresh is disrupted! Reconnecting!
                    </h1>
                )}
                {this.state.connectionLimit === ConnectionLimit.Exhausted && (
                    <h1 id="connectionExhausted">
                        SignalR connection limit is reached. Please use refresh
                        option for live updates.
                    </h1>
                )}
            </div>
        );
    }
}
