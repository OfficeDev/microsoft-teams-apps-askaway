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
import * as microsoftTeams from '@microsoft/teams-js';
import * as jwt from 'jsonwebtoken';
/**
 * State for the askAwayTabTab React component
 */
export interface IAskAwayTabState extends ITeamsBaseComponentState {
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
export interface IAskAwayTabProps {}

/**
 * Implementation of the askAway Tab content page
 */
export class AskAwayTab extends msteamsReactBaseComponent<
    IAskAwayTabProps,
    IAskAwayTabState
> {
    constructor(props: {}) {
        super(props);
        microsoftTeams.initialize();
        this.onShowTaskModule = this.onShowTaskModule.bind(this);

        this.state = {
            teamContext: null,
            theme: 'Light',
        };

        microsoftTeams.getContext((context) => {
            this.setState({ teamContext: context });
        });
    }

    public adaptiveCardTemplate() {
        return {
            $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.2',
            body: [
                {
                    type: 'ColumnSet',
                    columns: [
                        {
                            type: 'Column',
                            width: 2,
                            items: [
                                {
                                    type: 'Container',
                                    items: [
                                        {
                                            type: 'TextBlock',
                                            text: 'Title name',
                                            wrap: true,
                                        },
                                        {
                                            type: 'Input.Text',
                                            id: 'title',
                                            placeholder:
                                                'Connect with explore interns',
                                            maxLength: 250,
                                        },
                                        {
                                            type: 'TextBlock',
                                            text: 'Description',
                                            wrap: true,
                                        },
                                        {
                                            type: 'Input.Text',
                                            id: 'Description',
                                            maxLength: 250,
                                            placeholder:
                                                'Ask these upcoming interns anything! Life, work and anything you are interested!',
                                            isMultiline: true,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
            actions: [
                {
                    id: 'submit',
                    type: 'Action.Submit',
                    title: 'Create',
                },
            ],
        };
    }

    public onShowTaskModule() {
        let taskInfo: any = {
            title: 'Microsoft Corporation',
            height: 510,
            width: 500,
            fallbackUrl: '',
            completionBotId: '3760bd95-daa7-45e7-b7fa-ebc6fe2e9ec4',
            card: this.adaptiveCardTemplate(),
        };

        let submitHandler = (err: any, result: any) => {
            console.log(`Submit handler - err: ${err}`);
            console.log(`Submit handler - result: ${result}`);
        };

        microsoftTeams.tasks.startTask(taskInfo, submitHandler);
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

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        return (
            <Provider theme={this.state.theme}>
                <Flex hAlign="center" vAlign="center" className="screen">
                    <Image
                        className="icon2"
                        alt="image"
                        src={require('./../../web/assets/icon2.png')}
                    />
                    <Flex.Item align="center">
                        <Text
                            className="text-caption"
                            content="Welcome to Ask Away! We’re glad you’re here."
                        />
                    </Flex.Item>
                    <Flex.Item align="center">
                        <Text
                            className="text-subcaption"
                            content="Ask away is your tool to create and manage Q&A sessions."
                        />
                    </Flex.Item>
                    <Flex.Item align="center">
                        <Button
                            primary
                            className="button"
                            content="Create an ask away"
                            onClick={this.onShowTaskModule}
                        />
                    </Flex.Item>
                </Flex>
            </Provider>
        );
    }
}
