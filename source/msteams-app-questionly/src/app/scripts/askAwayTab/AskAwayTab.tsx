// tslint:disable-next-line:no-relative-imports
import './index.scss';
import { MeetingPanel } from './MeetingPanel';
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
import { ContentTypes } from 'adaptivecards';
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
    frameContext?: string;
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

    public successModel() {
        return {
            $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.0',
            body: [
                {
                    type: 'Container',
                    minHeight: '150px',
                    verticalContentAlignment: 'center',
                    items: [
                        {
                            type: 'Image',
                            url:
                                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAATvSURBVHgB5ZtdftpIDMClMXlPT1BygibPWxI4wbKlfQ49QEI4AckJCMkBSt9Lmp4AFn77vOwJltyA9+JRpSGQQExs4zH+6P8BfzAYS9ZoNNIYIWba/eo+OKrqKPUOiYp8qkhE+4BYXGlINEHEKe9NtKb/NOoxuDBuVu4nECMIMdAeVcsFUCdEUH8haEj4BseEOHBx9rX5x/0YLGNNAfKkHUfV+Sn+SQBliAOECWi6Oj++64IlIitABC8UVIMAL/hwH3YBK4K7U/esdHcFEYmkgJvhhzooaAFhEZLAgkVspQB+6sVCwfkSm6mHBaHr/nSvtnGYoRUgDs4B5zvsytyDwtbgamg2j3v3YX6mwjS+HX1osfB9SJvwAkHRQfgu9xjmZ4EtgPt7m4e0C8gACHQZ1EEGUsDNsPaFW9YhSyBdn7+/a/o18+0CxqSyJrxAeBGkO7xqAXIBHt8vIcP4dYeNCrgd1qrETgVygAtYaZa+Dby+81SAjPPOnuonFuDYZ+rO3COvOMHTBzh7TitHwgv7DgduXl+8UIAJbymDTs+fspFtjZcWILF9XlHYMvmJ56eeH5hhI1+mvwpHi0qplWBuRQGUxfE+JKiw8dwKlgqY930sQv4xiZvFwZMF5Lnvr8NZq8WuUUC7/+nwN3n6C8rt0cey7BgFKDWrQ5ohmHLENpDMMVhCaV02W/Oh1AmkFM46dc6Pe2/OSr0Kp74OeG4SOQ8ooIOnZmvC3oLzP6QQEbZR+na5fv5mVJOkTBkiwuHxG1VwnENIIZuEN99p+hsswKNBVWmi1CngNeEFNt+3YON/WHbFgcE7SBF+wkuX5VZlsAGqomLvWoSUEER4m9N0Fv6tMoXKFLBr4c1/IuyrqMVLzwvz0OUW3ANXqSMukH71b7974R//uFgAy3gIU++MPk44N9cK2H6FuLNToQojQdCzWXf9nAjoFcAkLbxgXQGb6nPrSkiD8IKyGV8Li0mGFwslpEV4U2a/HdX+ZadlLxiSIuVPt7Lt0pZdZqRl9Yli4SdgEylS7jn9ecASjl2n4zXBgyKtH8A2WyghkVoE0VghovWFR/OLB1dCUoUYhXqsXFeHWlAQigBKSLIKNXPZB7CzmtoeCVZ4RQlJCi8OUBy1iQOChKuR8FBC0vVHrbXJKZhQWCs1cDaEqtYQJXDmiYfd8fyQh16CxNCaurJdVodtpZkyAcGE84wHsvsUChP9gN8GWobkSwXwaNDlzRTyjnn6TwsrlwqQ0YCTjR3IOYS44vBXZoPsGa9jHRKThp/++iRsRQEmJgCwUnhIJ/RCNs81QrkcERC65+97n9dPeyZEuGIiDfPjEMlM0T0t21MBEiK6BJ8hJ7CZNzflJzamxGTVta1CZJKIDGevrCD3XSvcGdWuuVEDMohf6k0ItFi6M6x1EeEUMoRM8BrHvbpfu0BZYbmQFDsgI8i9BhFeCJwWb5R6F1nwCXOz7wV+ryH8KzPDWpWnzu04SmqRIJi6iH9tWhS9idCFERkdeOJUiT2JEgJZP+S67lFY4R9/uz2Pa29biVkDSUo/gdfm1uHi5yWSPt2ZItjceVbX4Trk9eP8ZWusKGBB3BYhpk6cuJHcRVTBn13TPu1/Ph0qrevsYE6ilt0ke6sBf2gWfps+HuD68WIywY5zqGRB0nw9kv/r8wAPXLYacJpqYOtJb+IX2sdVcXUAdmkAAAAASUVORK5CYII=',
                            horizontalAlignment: 'center',
                        },
                        {
                            type: 'TextBlock',
                            text: 'New session successfully created',
                            horizontalAlignment: 'center',
                            weight: 'bolder',
                            size: 'large',
                        },
                    ],
                },
            ],
        };
    }

    public onShowTaskModule() {
        let taskInfo: any = {
            title: 'Microsoft Corporation',
            fallbackUrl: '',
            appId: process.env.MicrosoftAppId,
            card: this.adaptiveCardTemplate(),
        };

        let submitHandler = (err: any, result: any) => {
            console.log(`Submit handler - err: ${err}`);
            console.log(`Submit handler - result: ${result}`);
            this.showSuccessModel();
        };

        microsoftTeams.tasks.startTask(taskInfo, submitHandler);
    }
    public async componentWillMount() {
        this.updateTheme(this.getQueryVariable('theme'));

        if (await this.inTeams()) {
            microsoftTeams.initialize();
            microsoftTeams.registerOnThemeChangeHandler(this.updateTheme);
            microsoftTeams.getContext((context) => {
                this.setState({
                    frameContext: context['frameContext'],
                });
                console.log('TabContext123', context);
                console.log('sidepanel', this.state.frameContext);
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
     * Show success popup
     */
    public showSuccessModel() {
        let taskInfo: any = {
            title: 'Microsoft Corporation',
            fallbackUrl: '',
            appID: process.env.MicrosoftAppId,
            card: this.successModel(),
        };

        let submitHandler = (err: any, result: any) => {
            console.log(`Submit handler - err: ${err}`);
            console.log(`Submit handler - result: ${result}`);
        };

        microsoftTeams.tasks.startTask(taskInfo, submitHandler);
    }

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        return (
            <Provider theme={this.state.theme}>
                {this.state.frameContext === 'sidePanel' && (
                    <React.Fragment>
                        <MeetingPanel />
                    </React.Fragment>
                )}
                {this.state.frameContext === 'content' && (
                    <React.Fragment>
                        <Flex
                            hAlign="center"
                            vAlign="center"
                            className="screen"
                        >
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
                    </React.Fragment>
                )}
            </Provider>
        );
    }
}
