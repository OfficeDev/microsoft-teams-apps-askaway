// tslint:disable-next-line:no-relative-imports
import './index.scss';
// tslint:disable-next-line:no-relative-imports
import { MeetingPanel } from './MeetingPanel';
// tslint:disable-next-line:no-relative-imports
import { TabContent } from './TabContent';
import * as React from 'react';
import { Provider } from '@fluentui/react-northstar';
import msteamsReactBaseComponent, {
    ITeamsBaseComponentState,
} from 'msteams-react-base-component';
import * as microsoftTeams from '@microsoft/teams-js';
import * as jwt from 'jsonwebtoken';
// tslint:disable-next-line:no-relative-imports
import { CONST } from './../askAwayTab/shared/ConfigVariables';
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
    teamContext: microsoftTeams.Context;
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
        microsoftTeams.getContext((context) => {
            this.setState({ teamContext: context });
        });
    }

    /**
     * Initialize teams plugin
     */
    async initializeTeams() {
        if (await this.inTeams()) {
            microsoftTeams.initialize();
            microsoftTeams.registerOnThemeChangeHandler(this.updateTheme);
            microsoftTeams.getContext((context) => {
                this.updateTheme(context.theme);
                microsoftTeams.authentication.getAuthToken({
                    successCallback: (token: string) => {
                        const decoded: { [key: string]: any } = jwt.decode(
                            token
                        ) as { [key: string]: any };
                        this.setState({ name: decoded!.name });
                        microsoftTeams.appInitialization.notifySuccess();
                        this.setState({
                            token: token,
                            entityId: context.entityId,
                            frameContext: context.frameContext,
                            channelId: context.channelId,
                            chatId: context.chatId,
                            userId: context.userObjectId,
                            meetingId: context['meetingId'],
                        });
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

    public async componentWillMount() {
        this.updateTheme(this.getQueryVariable('theme'));
        await this.initializeTeams();
    }

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        return (
            <Provider theme={this.state.theme}>
                {this.state.frameContext === CONST.FC_SIDEPANEL && (
                    <MeetingPanel teamsData={this.state.teamContext} />
                )}
                {this.state.frameContext === CONST.FC_CONTENT && (
                    <TabContent teamsData={this.state.teamContext} />
                )}
            </Provider>
        );
    }
}
