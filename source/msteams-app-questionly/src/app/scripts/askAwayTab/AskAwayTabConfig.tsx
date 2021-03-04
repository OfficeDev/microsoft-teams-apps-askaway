import { Provider } from '@fluentui/react-northstar';
import * as microsoftTeams from '@microsoft/teams-js';
import { SeverityLevel } from '@microsoft/applicationinsights-web';
import msteamsReactBaseComponent, { ITeamsBaseComponentState } from 'msteams-react-base-component';
import * as React from 'react';
import { trackTrace } from '../telemetryService';
import { i18next } from './../askAwayTab/shared/i18next';
import AskAwayTabConfigInternal from './AskAwayTabConfigInternal';
import './index.scss';
import Helper from './shared/Helper';

export interface IAskAwayTabConfigState extends ITeamsBaseComponentState {
    value: string;
    locale: string;
    direction?: string;
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
                Helper.setI18nextLocale(i18next, context.locale, (err) => {
                    if (err) {
                        trackTrace(`Error occurred while setting the language and the error is: ${err.message}`, SeverityLevel.Error);
                    } else {
                        this.setState({
                            direction: i18next.dir(),
                        });
                    }
                });
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
            <Provider rtl={this.state.direction == 'rtl'} theme={this.state.theme}>
                <AskAwayTabConfigInternal />
            </Provider>
        );
    }
}
