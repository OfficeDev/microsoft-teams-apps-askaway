import * as React from 'react';
import TeamsBaseComponent, {
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
}

/**
 * Properties for the askAwayTabTab React component
 */
export interface IAskAwayTabProps {}

/**
 * Implementation of the askAway Tab content page
 */
export class AskAwayTab extends TeamsBaseComponent<
    IAskAwayTabProps,
    IAskAwayTabState
> {
    public async componentWillMount() {
        this.updateTheme(this.getQueryVariable('theme'));

        if (await this.inTeams()) {
            microsoftTeams.initialize();
            microsoftTeams.registerOnThemeChangeHandler(this.updateTheme);
            microsoftTeams.getContext((context) => {
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
            <div>
                <h3>This is react tab!</h3>
            </div>
        );
    }
}
