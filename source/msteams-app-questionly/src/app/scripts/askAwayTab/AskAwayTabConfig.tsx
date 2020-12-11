import './index.scss';
import * as React from 'react';
import { Provider, Flex, Text, Image } from '@fluentui/react-northstar';
import msteamsReactBaseComponent, {
    ITeamsBaseComponentState,
} from 'msteams-react-base-component';
import * as microsoftTeams from '@microsoft/teams-js';

export interface IAskAwayTabConfigState extends ITeamsBaseComponentState {
    value: string;
}

export interface IAskAwayTabConfigProps {}

/**
 * Implementation of askAway Tab configuration page
 */
export class AskAwayTabConfig extends msteamsReactBaseComponent<
    IAskAwayTabConfigProps,
    IAskAwayTabConfigState
> {
    public async componentWillMount() {
        this.updateTheme(this.getQueryVariable('theme'));

        if (await this.inTeams()) {
            microsoftTeams.initialize();

            microsoftTeams.getContext((context: microsoftTeams.Context) => {
                this.setState({
                    value: context.entityId,
                });
                this.updateTheme(context.theme);
                microsoftTeams.settings.setValidityState(true);
                microsoftTeams.appInitialization.notifySuccess();
            });

            microsoftTeams.settings.registerOnSaveHandler(
                (saveEvent: microsoftTeams.settings.SaveEvent) => {
                    // Calculate host dynamically to enable local debugging
                    const host = 'https://' + window.location.host;
                    microsoftTeams.settings.setSettings({
                        contentUrl:
                            host +
                            '/askAwayTab/?name={loginHint}&tenant={tid}&group={groupId}&theme={theme}',
                        websiteUrl:
                            host +
                            '/askAwayTab/?name={loginHint}&tenant={tid}&group={groupId}&theme={theme}',
                        suggestedDisplayName: 'AskAway',
                        removeUrl:
                            host + '/askAwayTab/remove.html?theme={theme}',
                        entityId: this.state.value,
                    });
                    saveEvent.notifySuccess();
                }
            );
        } else {
        }
    }

    public render() {
        return (
            <Provider theme={this.state.theme}>
                <Flex hAlign="center" vAlign="center" className="screen">
                    <Image
                        className="askaway-tab-added"
                        alt="image"
                        src={require('./../../web/assets/askaway_tab_added.png')}
                    />
                    <Flex.Item align="center">
                        <Text
                            className="text-configtab-caption"
                            content="Select save to finish adding ask away to the meeting"
                        />
                    </Flex.Item>
                </Flex>
            </Provider>
        );
    }
}
