import msteamsReactBaseComponent, { ITeamsBaseComponentState } from 'msteams-react-base-component';
import * as microsoftTeams from '@microsoft/teams-js';
import * as React from 'react';
import './../index.scss';
import { Provider } from '@fluentui/react-northstar';
import Helper from '../shared/Helper';
import { i18next } from '../shared/i18next';
import QnaSessionNotificationInternal from './QnaSessionNotificationInternal';

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
        microsoftTeams.getContext((context: microsoftTeams.Context) => {
            // Set Language for Localization
            Helper.setI18nextLocale(i18next, context.locale);
        });
    }

    /**
     * event handler for `ok` button click.
     */
    handleOnSubmit = () => {
        microsoftTeams.tasks.submitTask();
    };

    public render() {
        const searchParams = new URL(decodeURIComponent(window.location.href)).searchParams;

        return (
            <Provider style={{ background: 'unset' }} theme={this.state.theme}>
                <QnaSessionNotificationInternal onSubmitSession={this.handleOnSubmit} searchParams={searchParams} />
            </Provider>
        );
    }
}
