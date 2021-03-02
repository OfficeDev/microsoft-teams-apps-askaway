import { Provider } from '@fluentui/react-northstar';
import * as microsoftTeams from '@microsoft/teams-js';
import msteamsReactBaseComponent, { ITeamsBaseComponentState } from 'msteams-react-base-component';
import * as React from 'react';
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import Helper from '../../shared/Helper';
import { HttpService } from '../../shared/HttpService';
import { i18next } from '../../shared/i18next';
import './../../index.scss';
import { SwitchSessionInternal } from './SwitchSessionInternal';

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

    componentDidMount() {
        this.updateTheme(this.getQueryVariable('theme'));
        // Set Language for Localization
        if (this.getQueryVariable('locale')) {
            Helper.setI18nextLocale(i18next, this.getQueryVariable('locale'));
        }
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
            <Provider theme={this.state?.theme}>
                <SwitchSessionInternal qnaSessions={this.state.qnaSessions} showError={this.state.showError} selectedSessionId={selectedSessionId}></SwitchSessionInternal>
            </Provider>
        );
    }
}
