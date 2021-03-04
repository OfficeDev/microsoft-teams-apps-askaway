import { Provider } from '@fluentui/react-northstar';
import * as microsoftTeams from '@microsoft/teams-js';
import { SeverityLevel } from '@microsoft/applicationinsights-web';
import msteamsReactBaseComponent, { ITeamsBaseComponentState } from 'msteams-react-base-component';
import * as React from 'react';
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import Helper from '../../shared/Helper';
import { HttpService } from '../../shared/HttpService';
import { i18next } from '../../shared/i18next';
import './../../index.scss';
import { SwitchSessionInternal } from './SwitchSessionInternal';
import { trackTrace } from '../../../telemetryService';

export interface SwitchSessionProps {}

export interface SwitchSessionState extends ITeamsBaseComponentState {
    theme: any;
    /**
     * Q&A session list.
     */
    qnaSessions: ClientDataContract.QnaSession[] | null;
    /**
     * Boolean representing if error should be shown.
     */
    showError: boolean;
    direction?: string;
}

/**
 * React component for switch session experiance.
 */
export class SwitchSession extends msteamsReactBaseComponent<SwitchSessionProps, SwitchSessionState> {
    constructor(props) {
        super(props);
        this.state = {
            qnaSessions: null,
            showError: false,
            theme: {},
        };
        microsoftTeams.initialize();
    }

    componentWillMount() {
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
        });
    }

    componentDidMount() {
        this.updateTheme(this.getQueryVariable('theme'));
        this.fetchSessions();
    }

    /**
     * Fetches session list.
     */
    private async fetchSessions() {
        const searchParams = new URL(decodeURIComponent(window.location.href))?.searchParams;
        const conversationId = searchParams.get('conversationId');

        try {
            const response = await new HttpService().get(`/conversations/${conversationId}/sessions`);

            this.setState({ qnaSessions: response.data });
        } catch {
            this.setState({ showError: true });
        }
    }

    public render() {
        const searchParams = new URL(decodeURIComponent(window.location.href))?.searchParams;
        const selectedSessionId = searchParams.get('selectedSessionId');

        return (
            <Provider rtl={this.state.direction == 'rtl'} theme={this.state?.theme}>
                <SwitchSessionInternal qnaSessions={this.state.qnaSessions} showError={this.state.showError} selectedSessionId={selectedSessionId}></SwitchSessionInternal>
            </Provider>
        );
    }
}
