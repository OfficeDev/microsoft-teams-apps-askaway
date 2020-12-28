import msteamsReactBaseComponent, {
    ITeamsBaseComponentState,
} from 'msteams-react-base-component';
import * as React from 'react';
import './../index.scss';
import { Button } from '@fluentui/react-northstar';

export interface QnaSessionCreatedNotificationProps {}

/**
 * React component for qna session created event notification bubble.
 */
export class QnaSessionCreatedNotification extends msteamsReactBaseComponent<
    QnaSessionCreatedNotificationProps,
    ITeamsBaseComponentState
> {
    public async componentWillMount() {
        microsoftTeams.initialize();
        this.updateTheme(this.getQueryVariable('theme'));
    }

    /**
     * event handler for `ok` button click.
     */
    private onSubmit() {
        microsoftTeams.tasks.submitTask();
    }

    public render() {
        {
            const searchParams = new URL(
                decodeURIComponent(window.location.href)
            ).searchParams;

            const sessionTitle = searchParams.get('title');
            const userName = searchParams.get('username');

            // TODO: Localize these.
            const notificationBubbleTitle = `${userName} started a Q&A session`;
            const notificationBubbleText = `Select the Ask Away icon at the top of the meeting view to participate`;

            return (
                <div>
                    <p style={{ color: 'white' }}>
                        {' '}
                        {notificationBubbleTitle}{' '}
                    </p>
                    <hr></hr>
                    <p style={{ color: 'white' }}>{sessionTitle}</p>
                    <p style={{ color: 'white' }}>{notificationBubbleText}</p>
                    <hr></hr>
                    <Button
                        primary
                        type="submit"
                        className="btn-create-session"
                        size="small"
                        onClick={this.onSubmit}
                    >
                        <Button.Content>Ok</Button.Content>
                    </Button>
                </div>
            );
        }
    }
}
