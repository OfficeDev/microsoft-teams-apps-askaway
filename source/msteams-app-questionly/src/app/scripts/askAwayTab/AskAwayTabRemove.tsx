import * as React from 'react';
import { Provider, Flex, Text, Header } from '@fluentui/react-northstar';
import msteamsReactBaseComponent, {
    ITeamsBaseComponentState,
} from 'msteams-react-base-component';
import * as microsoftTeams from '@microsoft/teams-js';

export interface IAskAwayTabRemoveState extends ITeamsBaseComponentState {
    value: string;
}
export interface IAskAwayTabRemoveProps {}

/**
 * Implementation of askAway Tab remove page
 */
export class AskAwayTabRemove extends msteamsReactBaseComponent<
    IAskAwayTabRemoveProps,
    IAskAwayTabRemoveState
> {
    public async componentWillMount() {
        this.updateTheme(this.getQueryVariable('theme'));

        if (await this.inTeams()) {
            microsoftTeams.initialize();
            microsoftTeams.appInitialization.notifySuccess();
        } else {
        }
    }

    public render() {
        return (
            <Provider theme={this.state.theme}>
                <Flex fill={true}>
                    <Flex.Item>
                        <div>
                            <Header content="You're about to remove your tab..." />
                            <Text content="You can just add stuff here if you want to clean up when removing the tab. For instance, if you have stored data in an external repository, you can delete or archive it here. If you don't need this remove page you can remove it." />
                        </div>
                    </Flex.Item>
                </Flex>
            </Provider>
        );
    }
}
