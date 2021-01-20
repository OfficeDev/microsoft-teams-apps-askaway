import msteamsReactBaseComponent, { ITeamsBaseComponentState } from 'msteams-react-base-component';
import * as microsoftTeams from '@microsoft/teams-js';
import * as React from 'react';
import './../index.scss';
import { Button, Provider, Flex, Text } from '@fluentui/react-northstar';

export interface QnaSessionCreatedNotificationProps {}

export interface QnaSessionCreatedNotificationState extends ITeamsBaseComponentState {
    theme: any;
}

/**
 * React component for qna session created event notification bubble.
 */
export class QnaSessionCreatedNotification extends msteamsReactBaseComponent<QnaSessionCreatedNotificationProps, QnaSessionCreatedNotificationState> {
    constructor(props) {
        super(props);
        microsoftTeams.initialize();
    }

    public async componentWillMount() {
        microsoftTeams.initialize();
        const theme = this.getQueryVariable('theme') ? this.getQueryVariable('theme') : 'dark';
        this.updateTheme(theme);
    }

    /**
     * event handler for `ok` button click.
     */
    private onSubmit() {
        microsoftTeams.tasks.submitTask();
    }

    public render() {
        const searchParams = new URL(decodeURIComponent(window.location.href)).searchParams;

        const sessionTitle = searchParams.get('title');
        const userName = searchParams.get('username');

        // TODO: Localize these.
        const notificationBubbleTitle = `${userName} started a Q&A session`;
        const notificationBubbleText = `Select the Ask Away icon at the top of the meeting view to participate`;
        return (
            <Provider style={{ background: 'unset' }} theme={this.state.theme}>
                <Flex column>
                    <Text content={notificationBubbleTitle} />
                    <div className="notification-title">
                        <Text content={sessionTitle} weight="bold" />
                    </div>
                    <Flex gap="gap.large" vAlign="center">
                        <Text content={notificationBubbleText} />
                        <Button primary type="submit" size="small" onClick={this.onSubmit}>
                            <Button.Content>Ok</Button.Content>
                        </Button>
                    </Flex>
                </Flex>
            </Provider>
        );
    }
}
