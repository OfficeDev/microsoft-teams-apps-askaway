// tslint:disable-next-line:no-relative-imports
import './index.scss';
import * as React from 'react';
import { Flex, Text, Button, Image } from '@fluentui/react-northstar';
// tslint:disable-next-line:no-relative-imports
import HttpService from './shared/HttpService';
import * as microsoftTeams from '@microsoft/teams-js';
export interface TabContentProps {
    teamsData: any;
}
export interface TabContentState {}

export class TabContent extends React.Component<
    TabContentProps,
    TabContentState
> {
    constructor(props) {
        super(props);
        this.onShowTaskModule = this.onShowTaskModule.bind(this);
    }

    componentDidMount() {
        this.getActiveSession();
    }

    public getActiveSession() {
        console.log('props', this.props);

        HttpService.get(
            `/conversations/${this.props.teamsData.chatId}/activesessions`
        )
            .then((response: any) => {
                console.log('response', response);
            })
            .catch((error) => {});
    }

    public adaptiveCardTemplate() {
        return {
            $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.3',
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
                                            validation: {
                                                necessity: 'Required',
                                                errorMessage:
                                                    'Title is required*',
                                            },
                                        },
                                        {
                                            type: 'TextBlock',
                                            text: 'Description',
                                            wrap: true,
                                        },
                                        {
                                            type: 'Input.Text',
                                            id: 'description',
                                            placeholder:
                                                'Ask these upcoming interns anything! Life, work and anything you are interested!',
                                            isMultiline: true,
                                            validation: {
                                                necessity: 'Required',
                                                errorMessage:
                                                    'Description is required*',
                                            },
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
            version: '1.2',
            body: [
                {
                    type: 'Container',
                    minHeight: '150px',
                    verticalContentAlignment: 'center',
                    items: [
                        {
                            type: 'Image',
                            url: `https://${process.env.HostName}/images/success_image.png`,
                            width: '20px',
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

    public failureModel() {
        return {
            $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.2',
            body: [
                {
                    type: 'Container',
                    minHeight: '150px',
                    verticalContentAlignment: 'center',
                    items: [
                        {
                            type: 'Image',
                            url: `https://${process.env.HostName}/images/failure_image.png`,
                            width: '160px',
                            horizontalAlignment: 'center',
                        },
                        {
                            type: 'TextBlock',
                            text:
                                'something went wrong. You should try again later.',
                            horizontalAlignment: 'center',
                            weight: 'bolder',
                            size: 'large',
                        },
                    ],
                },
            ],
            actions: [
                {
                    id: 'submit',
                    type: 'Action.Submit',
                    title: ' Ok ',
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
            if (result && result['title'] && result['description']) {
                const createSessionData = {
                    title: result['title'],
                    description: result['description'],
                    scopeId: this.props.teamsData.chatId,
                    // hostUserId: '',
                    isChannel: false,
                };
                HttpService.post(
                    `/conversations/${this.props.teamsData.chatId}/sessions`,
                    createSessionData
                )
                    .then((response: any) => {
                        if (response && response['qnaSessionId']) {
                            this.showAlertModel(true);
                        } else {
                            this.showAlertModel(false);
                        }
                    })
                    .catch((error) => {
                        this.showAlertModel(false);
                    });
            }
        };

        microsoftTeams.tasks.startTask(taskInfo, submitHandler);
    }

    /**
     * Show success popup
     */
    public showAlertModel(isSuccess = false) {
        let taskInfo: any = {
            title: 'Microsoft Corporation',
            fallbackUrl: '',
            appID: process.env.MicrosoftAppId,
            card: isSuccess ? this.successModel() : this.failureModel(),
        };

        let submitHandler = (err: any, result: any) => {};

        microsoftTeams.tasks.startTask(taskInfo, submitHandler);
    }
    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        return (
            <Flex hAlign="center" vAlign="center" className="screen">
                <Image
                    className="create-session"
                    alt="image"
                    src={require('./../../web/assets/create_session.png')}
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
                        onClick={this.onShowTaskModule}
                    >
                        <Button.Content>Create an ask away</Button.Content>
                    </Button>
                </Flex.Item>
            </Flex>
        );
    }
}
