import './index.scss';
import * as React from 'react';
import { Provider } from '@fluentui/react-northstar';
import msteamsReactBaseComponent, { ITeamsBaseComponentState } from 'msteams-react-base-component';
import * as microsoftTeams from '@microsoft/teams-js';
import AskAwayTabConfigInternal from './AskAwayTabConfigInternal';
import { i18next } from './../askAwayTab/shared/i18next';
import Helper from './shared/Helper';

export interface IAskAwayTabConfigState extends ITeamsBaseComponentState {
    value: string;
    locale: string;
}

export interface IAskAwayTabConfigProps {}

/**
 * Implementation of askAway Tab configuration page
 */
export class AskAwayTabConfig extends msteamsReactBaseComponent<IAskAwayTabConfigProps, IAskAwayTabConfigState> {
    public async componentWillMount() {
        this.updateTheme(this.getQueryVariable('theme'));

        if (await this.inTeams()) {
            microsoftTeams.initialize();

            microsoftTeams.getContext((context: microsoftTeams.Context) => {
                // Set Language for Localization
                Helper.setI18nextLocale(i18next, context.locale);
                this.setState({
                    value: context.entityId,
                    locale: context.locale,
                });
                this.updateTheme(context.theme);
                microsoftTeams.settings.setValidityState(true);
                microsoftTeams.appInitialization.notifySuccess();
            });

            microsoftTeams.settings.registerOnSaveHandler((saveEvent: microsoftTeams.settings.SaveEvent) => {
                // Calculate host dynamically to enable local debugging
                const host = 'https://' + window.location.host;
                microsoftTeams.settings.setSettings({
                    contentUrl: host + '/askAwayTab/?name={loginHint}&tenant={tid}&group={groupId}&theme={theme}',
                    suggestedDisplayName: 'AskAway',
                    entityId: this.state.value,
                });
                saveEvent.notifySuccess();
            });
        } else {
        }
    }

    public render() {
        return (
            <Provider theme={this.state.theme}>
                <AskAwayTabConfigInternal />
            </Provider>
        );
    }
}
