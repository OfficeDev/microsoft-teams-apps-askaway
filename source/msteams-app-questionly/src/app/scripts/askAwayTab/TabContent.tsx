// tslint:disable:no-relative-imports
import './index.scss';
import * as React from 'react';
import { withTranslation } from 'react-i18next';
import { Flex, Text, Button, Image } from '@fluentui/react-northstar';
import { SwitchIcon } from './../askAwayTab/shared/Icons/SwitchIcon';
import { AddIcon, RetryIcon } from '@fluentui/react-icons-northstar';
import * as microsoftTeams from '@microsoft/teams-js';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { HttpService } from './shared/HttpService';
import { Helper } from './shared/Helper';

export interface TabContentProps {
    teamsTabContext: microsoftTeams.Context;
    httpService: HttpService;
    appInsights: ApplicationInsights;
    helper: Helper;
}
export interface TabContentState {}

class TabContent extends React.Component<TabContentProps, TabContentState> {
    constructor(props) {
        super(props);
        this.onShowTaskModule = this.onShowTaskModule.bind(this);
    }

    componentDidMount() {
        this.getActiveSession();
    }

    private getActiveSession() {
        this.props.httpService
            .get(`/conversations/${this.props.teamsTabContext.chatId}/activesessions`)
            .then((response: any) => {})
            .catch((error) => {
                // TODO: handle this gracefully.
            });
    }

    private successModel() {
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
                            width: '75px',
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

    private failureModel() {
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
                            text: 'something went wrong. You should try again later.',
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

    private onShowTaskModule() {
        let taskInfo: any = {
            fallbackUrl: '',
            appId: process.env.MicrosoftAppId,
            url: `https://${process.env.HostName}/askAwayTab/createsession.html`,
        };

        let submitHandler = (err: any, result: any) => {
            if (result && result['title'] && result['description']) {
                const createSessionData = {
                    title: result['title'],
                    description: result['description'],
                    scopeId: this.props.teamsTabContext.chatId,
                    isChannel: false,
                };
                this.props.httpService
                    .post(`/conversations/${this.props.teamsTabContext.chatId}/sessions`, createSessionData)
                    .then((response: any) => {
                        if (response && response['data'] && response['data']['sessionId']) {
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
    private showAlertModel(isSuccess = false) {
        let taskInfo: any = {
            fallbackUrl: '',
            appID: process.env.MicrosoftAppId,
            card: isSuccess ? this.successModel() : this.failureModel(),
        };

        let submitHandler = (err: any, result: any) => {};

        microsoftTeams.tasks.startTask(taskInfo, submitHandler);
    }

    private crateNewSessionLayout() {
        return (
            <Flex hAlign="center" vAlign="center" className="screen">
                <Image className="create-session" alt="image" src={require('./../../web/assets/create_session.png')} />
                <Flex.Item align="center">
                    <Text className="text-caption" content="Welcome to Ask Away! We’re glad you’re here." />
                </Flex.Item>
                <Flex.Item align="center">
                    <Text className="text-subcaption" content="Ask away is your tool to create and manage Q&A sessions." />
                </Flex.Item>
                <Flex.Item align="center">
                    <Button primary className="button" onClick={this.onShowTaskModule}>
                        <Button.Content>Create an ask away</Button.Content>
                    </Button>
                </Flex.Item>
            </Flex>
        );
    }

    /**
     * Show Tab Header Design Part
     */
    private tabHeader() {
        return (
            <div>
                <Flex gap="gap.large" className="screen">
                    <Button text>
                        <RetryIcon xSpacing="after" />
                        <Button.Content>Refresh</Button.Content>
                    </Button>
                    <Button text>
                        <AddIcon outline xSpacing="after" />
                        <Button.Content>Create a new session</Button.Content>
                    </Button>
                    <Button text>
                        <SwitchIcon outline xSpacing="after" />
                        <Button.Content>Switch to different sessions</Button.Content>
                    </Button>
                </Flex>
            </div>
        );
    }

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        return (
            <React.Fragment>
                {this.tabHeader()}
                {this.crateNewSessionLayout()}
            </React.Fragment>
        );
    }
}
// tslint:disable-next-line:export-name
export default withTranslation()(TabContent);
