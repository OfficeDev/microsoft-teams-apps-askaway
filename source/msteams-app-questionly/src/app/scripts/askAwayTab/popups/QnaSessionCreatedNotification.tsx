// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Provider } from '@fluentui/react-northstar';
import * as microsoftTeams from '@microsoft/teams-js';
import { SeverityLevel } from '@microsoft/applicationinsights-web';
import msteamsReactBaseComponent, { ITeamsBaseComponentState } from 'msteams-react-base-component';
import * as React from 'react';
import { trackTrace } from '../../telemetryService';
import Helper from '../shared/Helper';
import { i18next } from '../shared/i18next';
import './../index.scss';
import QnaSessionNotificationInternal from './QnaSessionNotificationInternal';

export interface QnaSessionCreatedNotificationProps {}

export interface QnaSessionCreatedNotificationState extends ITeamsBaseComponentState {
    theme: any;
    direction?: string;
}

/**
 * React component for qna session created event notification bubble.
 */
export class QnaSessionCreatedNotification extends msteamsReactBaseComponent<QnaSessionCreatedNotificationProps, QnaSessionCreatedNotificationState> {
    constructor(props) {
        super(props);
        this.state = {
            theme: {},
            direction: '',
        };
        microsoftTeams.initialize();
    }

    public async componentWillMount() {
        microsoftTeams.initialize();
        microsoftTeams.getContext((context: microsoftTeams.Context) => {
            // Set Language for Localization
            Helper.setI18nextLocale(i18next, context.locale, (err) => {
                if (err) {
                    trackTrace(`Error occurred while setting the language and the error is: ${err.message}`, SeverityLevel.Error);
                } else {
                    this.setState({
                        direction: i18next.dir(),
                    });
                }
            });
            this.updateTheme(context.theme);
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
        const { direction, theme } = this.state;
        return (
            <div>
                {direction && (
                    <Provider rtl={direction === 'rtl'} style={{ background: 'unset' }} theme={theme}>
                        <QnaSessionNotificationInternal onSubmitSession={this.handleOnSubmit} searchParams={searchParams} />
                    </Provider>
                )}
            </div>
        );
    }
}
