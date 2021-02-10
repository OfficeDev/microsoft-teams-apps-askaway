import * as React from 'react';
import { Provider } from '@fluentui/react-northstar';
import msteamsReactBaseComponent, { ITeamsBaseComponentState } from 'msteams-react-base-component';
import * as microsoftTeams from '@microsoft/teams-js';
import AskAwayTabRemoveInternal from './AskAwayTabRemoveInternal';
import { i18next } from './../askAwayTab/shared/i18next';
import Helper from './shared/Helper';

export interface IAskAwayTabRemoveState extends ITeamsBaseComponentState {
    value: string;
}
export interface IAskAwayTabRemoveProps {}

/**
 * Implementation of askAway Tab remove page
 */
export class AskAwayTabRemove extends msteamsReactBaseComponent<IAskAwayTabRemoveProps, IAskAwayTabRemoveState> {
    public async componentWillMount() {
        this.updateTheme(this.getQueryVariable('theme'));
        // Set Language for Localization
        if (this.getQueryVariable('locale')) {
            Helper.setI18nextLocale(i18next, this.getQueryVariable('locale'));
        }
        if (await this.inTeams()) {
            microsoftTeams.initialize();
            microsoftTeams.appInitialization.notifySuccess();
        }
    }

    public render() {
        return (
            <Provider theme={this.state.theme}>
                <AskAwayTabRemoveInternal />
            </Provider>
        );
    }
}
