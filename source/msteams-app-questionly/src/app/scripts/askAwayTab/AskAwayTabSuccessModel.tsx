// tslint:disable-next-line:no-relative-imports
import './index.scss';
import * as React from 'react';
import {
    Provider,
    Flex,
    Text,
    Button,
    Header,
    Image,
} from '@fluentui/react-northstar';
import msteamsReactBaseComponent, {
    ITeamsBaseComponentState,
} from 'msteams-react-base-component';
import * as jwt from 'jsonwebtoken';
import * as microsoftTeams from '@microsoft/teams-js';

export interface IAskAwayTabSuccessModelState extends ITeamsBaseComponentState {
    entityId?: string;
    name?: string;
    error?: string;
    token?: string;
    teamContext: microsoftTeams.Context | null;
    theme: any;
}
/**
 * Properties for the askAwayTabTab React component
 */
export interface IAskAwayTabSuccessModelProps {}

export class AskAwayTabSuccessModel extends msteamsReactBaseComponent<
    IAskAwayTabSuccessModelProps,
    IAskAwayTabSuccessModelState
> {
    constructor(props: {}) {
        super(props);
        microsoftTeams.initialize();

        this.showSuccessModel = this.showSuccessModel.bind(this);

        this.state = {
            teamContext: null,
            theme: 'Light',
        };

        microsoftTeams.getContext((context) => {
            this.setState({ teamContext: context });
        });
    }

    public async componentWillMount() {
        this.updateTheme(this.getQueryVariable('theme'));

        if (await this.inTeams()) {
            microsoftTeams.initialize();
            microsoftTeams.registerOnThemeChangeHandler(this.updateTheme);
            microsoftTeams.getContext((context) => {
                microsoftTeams.appInitialization.notifySuccess();
                this.setState({
                    entityId: context.entityId,
                });
                this.updateTheme(context.theme);
                microsoftTeams.authentication.getAuthToken({
                    successCallback: (token: string) => {
                        const decoded: { [key: string]: any } = jwt.decode(
                            token
                        ) as { [key: string]: any };
                        this.setState({ name: decoded!.name });
                        microsoftTeams.appInitialization.notifySuccess();
                        this.setState({ token: token });
                    },
                    failureCallback: (message: string) => {
                        this.setState({ error: message });
                        microsoftTeams.appInitialization.notifyFailure({
                            reason:
                                microsoftTeams.appInitialization.FailedReason
                                    .AuthFailed,
                            message,
                        });
                    },
                    resources: [process.env.ASKAWAYTAB_APP_URI as string],
                });
            });
        } else {
            this.setState({
                entityId: 'This is not hosted in Microsoft Teams',
            });
        }
    }

    public showSuccessModel() {
        return (
            <Provider theme={this.state.theme}>
                <Flex hAlign="center" vAlign="center" className="screen">
                    <Image
                        className="icon2"
                        alt="image"
                        src={require('./../../web/assets/icon4.png')}
                    />
                    <Flex.Item align="center">
                        <Text
                            className="text-caption success-caption"
                            content="New session successfully created"
                        />
                    </Flex.Item>
                </Flex>
            </Provider>
        );
    }

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        return <React.Fragment>{this.showSuccessModel()}</React.Fragment>;
    }
}
