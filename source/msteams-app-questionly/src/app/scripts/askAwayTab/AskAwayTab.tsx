import { Provider } from '@fluentui/react-northstar';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { SeverityLevel } from '@microsoft/applicationinsights-web';
import * as microsoftTeams from '@microsoft/teams-js';
import { TFunction } from 'i18next';
import msteamsReactBaseComponent, { ITeamsBaseComponentState } from 'msteams-react-base-component';
import * as React from 'react';
import { i18next } from './../askAwayTab/shared/i18next';
import { telemetryService } from './../telemetryService';
import './index.scss';
import MeetingPanel from './MeetingPanel';
import Helper from './shared/Helper';
import { HttpService } from './shared/HttpService';
import TabContent from './TabContent';

/**
 * State for the askAwayTabTab React component
 */
export interface IAskAwayTabState extends ITeamsBaseComponentState {
    entityId?: string;
    error?: string;
    token?: string;
    channelId?: string;
    chatId?: string;
    userId?: string;
    meetingId?: string;
    /**
     * Data event for real time UX.
     */
    dataEvent: any;
    theme: any;
    teamContext: microsoftTeams.Context;
    frameContext?: string;
    direction?: string;
}
/**
 * Properties for the askAwayTabTab React component
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IAskAwayTabProps {}

/**
 * Implementation of the askAway Tab content page
 */
export class AskAwayTab extends msteamsReactBaseComponent<IAskAwayTabProps, IAskAwayTabState> {
    public localize: TFunction;
    private httpService: HttpService;

    constructor(props) {
        super(props);
        microsoftTeams.initialize();
    }

    public async componentWillMount() {
        this.updateTheme(this.getQueryVariable('theme'));
        await this.initializeTeams();
        this.httpService = new HttpService(telemetryService.appInsights);
    }

    /**
     * Initialize teams plugin
     */
    async initializeTeams() {
        if (await this.inTeams()) {
            microsoftTeams.initialize();
            microsoftTeams.registerOnThemeChangeHandler((theme: string) => {
                this.updateTheme(theme);
                this.setState((prevState) => ({
                    teamContext: {
                        ...prevState.teamContext,
                        theme: theme!,
                    },
                }));
            });
            microsoftTeams.getContext((context) => {
                Helper.setI18nextLocale(i18next, context.locale, (err) => {
                    if (err) {
                        telemetryService.appInsights.trackTrace({
                            message: `Error occurred while setting the language and the error is: ${err.message}`,
                            severityLevel: SeverityLevel.Error,
                        });
                    } else {
                        this.setState({
                            direction: i18next.dir(),
                        });
                    }
                });
                microsoftTeams.authentication.getAuthToken({
                    successCallback: (token: string) => {
                        microsoftTeams.appInitialization.notifySuccess();
                        this.setState({
                            token: token,
                            entityId: context.entityId,
                            frameContext: context.frameContext,
                            channelId: context.channelId,
                            chatId: context.chatId,
                            userId: context.userObjectId,
                            meetingId: context.meetingId,
                            teamContext: context,
                        });
                    },
                    failureCallback: (message: string) => {
                        this.setState({ error: message });
                        microsoftTeams.appInitialization.notifyFailure({
                            reason: microsoftTeams.appInitialization.FailedReason.AuthFailed,
                            message,
                        });
                        telemetryService.appInsights.trackTrace({
                            message: 'Authentication failure. Could not get authentication token.',
                            severityLevel: SeverityLevel.Error,
                        });
                    },
                });
            });
        } else {
            this.setState({
                entityId: 'This is not hosted in Microsoft Teams',
            });
        }
    }

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        return (
            <Provider rtl={this.state.direction == 'rtl'} style={{ background: 'unset' }} theme={this.state.theme}>
                <div>
                    {this.state.dataEvent && <h1>{this.state.dataEvent.type}</h1>}
                    {this.state.frameContext === microsoftTeams.FrameContexts.sidePanel && (
                        <MeetingPanel teamsTabContext={this.state.teamContext} httpService={this.httpService} appInsights={telemetryService.appInsights} helper={Helper} />
                    )}
                    {this.state.frameContext === microsoftTeams.FrameContexts.content && (
                        <TabContent teamsTabContext={this.state.teamContext} httpService={this.httpService} appInsights={telemetryService.appInsights} helper={Helper} />
                    )}
                </div>
            </Provider>
        );
    }
}

export default withAITracking(telemetryService.reactPlugin, AskAwayTab);
