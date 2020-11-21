// tslint:disable-next-line:no-relative-imports
import './index.scss';
import { MeetingPanel } from './MeetingPanel';
import { TeamsContent } from './TeamsContent';
import * as React from 'react';
import { Provider } from '@fluentui/react-northstar';
import msteamsReactBaseComponent, {
    ITeamsBaseComponentState,
} from 'msteams-react-base-component';
import * as microsoftTeams from '@microsoft/teams-js';
import * as jwt from 'jsonwebtoken';
/**
 * State for the askAwayTabTab React component
 */
export interface IAskAwayTabState extends ITeamsBaseComponentState {
    entityId?: string;
    name?: string;
    error?: string;
    token?: string;
    channelId?: string;
    chatId?: string;
    userId?: string;
    meetingId?: string;
    theme: any;
    teamContext: microsoftTeams.Context | null;
    frameContext?: string;
}
/**
 * Properties for the askAwayTabTab React component
 */
export interface IAskAwayTabProps {}

/**
 * Implementation of the askAway Tab content page
 */
export class AskAwayTab extends msteamsReactBaseComponent<
    IAskAwayTabProps,
    IAskAwayTabState
> {
    constructor(props) {
        super(props);
        microsoftTeams.initialize();
        this.state = {
            teamContext: null,
            theme: 'Light',
        };
        microsoftTeams.getContext((context) => {
            this.setState({ teamContext: context });
        });
    }

    public async componentWillMount() {
        this.updateTheme(this.getQueryVariable('theme'));
        if (await this.inTeams()) {
            microsoftTeams.initialize();
            microsoftTeams.registerOnThemeChangeHandler(this.updateTheme);
            microsoftTeams.getContext((context) => {
                this.setState({
                    frameContext: context['frameContext'],
                });
                microsoftTeams.appInitialization.notifySuccess();
                this.setState({
                    entityId: context.entityId,
                });
                this.updateTheme(context.theme);
                microsoftTeams.authentication.getAuthToken({
                    successCallback: (token: string) => {
                        const decoded: { [key: string]: any } = jwt.decode(
                            token
                        ) as { [key: string]: any };
                        this.setState({ name: decoded!.name });
                        microsoftTeams.appInitialization.notifySuccess();
                        const st = this.state;
                        this.setState({ token: token });
                        this.setState({ channelId: context.channelId });
                        this.setState({ chatId: context.chatId });
                        this.setState({ userId: context.userObjectId });
                        this.setState({ meetingId: context['meetingId'] });
                    },
                    failureCallback: (message: string) => {
                        this.setState({ error: message });
                        microsoftTeams.appInitialization.notifyFailure({
                            reason:
                                microsoftTeams.appInitialization.FailedReason
                                    .AuthFailed,
                            message,
                        });
                    },
                    resources: [process.env.ASKAWAYTAB_APP_URI as string],
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
            <Provider theme={this.state.theme}>
                {this.state.frameContext === 'sidePanel' && (
                    <React.Fragment>
                        <MeetingPanel />
                    </React.Fragment>
                )}
                {this.state.frameContext === 'content' && (
                    <React.Fragment>
                        <TeamsContent teamsData={this.state.teamContext} />
                    </React.Fragment>
                )}
            </Provider>
        );
    }
}
