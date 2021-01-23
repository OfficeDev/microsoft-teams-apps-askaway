// tslint:disable:no-relative-imports
import './index.scss';
import * as React from 'react';
import { withTranslation } from 'react-i18next';
import * as microsoftTeams from '@microsoft/teams-js';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { Flex } from '@fluentui/react-northstar';
import { HttpService } from './shared/HttpService';
import { Helper } from './shared/Helper';
import TabHeader from './TabContent/TabHeader';
import PostNewQuestions from './TabContent/PostNewQuestions';
import NoQuestionDesign from './TabContent/NoQuestionDesign';
import TabQuestions from './TabContent/TabQuestions';
import CreateSession from './TabContent/CreateSession';
import { ClientDataContract } from '../../../../src/contracts/clientDataContract';

export interface TabContentProps {
    teamsTabContext: microsoftTeams.Context;
    httpService: HttpService;
    appInsights: ApplicationInsights;
    helper: Helper;
}
export interface TabContentState {
    activeSessionData: ClientDataContract.QnaSession;
}

class TabContent extends React.Component<TabContentProps, TabContentState> {
    constructor(props) {
        super(props);
        this.state = {
            activeSessionData: this.props.helper.createEmptyActiveSessionData(),
        };
    }

    componentDidMount() {
        this.getActiveSession();
    }

    /**
     * To Identify Active Session
     */
    getActiveSession = () => {
        this.props.httpService
            .get(`/conversations/${this.props.teamsTabContext.chatId}/activesessions`)
            .then((response) => {
                if (response?.data?.length > 0) {
                    this.setState({
                        activeSessionData: response.data[0],
                    });
                }
            })
            .catch((error) => {});
    };

    private successModal() {
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

    private failureModal() {
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

    /**
     * To End the active session
     * @param e - event
     */
    private endActiveSession = (e) => {
        if (this.state?.activeSessionData?.sessionId) {
            this.props.httpService
                .patch(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${this.state.activeSessionData.sessionId}`, { action: 'end' })
                .then((response) => {
                    this.setState({
                        activeSessionData: this.props.helper.createEmptyActiveSessionData(),
                    });
                })
                .catch((error) => {});
        }
    };

    private onShowTaskModule = () => {
        let taskInfo: any = {
            fallbackUrl: '',
            appId: process.env.MicrosoftAppId,
            url: `https://${process.env.HostName}/askAwayTab/createsession.html?theme=${this.props.teamsTabContext.theme}&locale=${this.props.teamsTabContext.locale}`,
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
                            this.showAlertModal(true);
                            this.setState({
                                activeSessionData: response.data,
                            });
                        } else {
                            this.showAlertModal(false);
                        }
                    })
                    .catch((error) => {
                        this.showAlertModal(false);
                    });
            }
        };

        microsoftTeams.tasks.startTask(taskInfo, submitHandler);
    };

    /**
     * Show success popup
     */
    private showAlertModal(isSuccess = false) {
        let taskInfo: any = {
            fallbackUrl: '',
            appID: process.env.MicrosoftAppId,
            card: isSuccess ? this.successModal() : this.failureModal(),
        };

        let submitHandler = (err: any, result: any) => {};

        microsoftTeams.tasks.startTask(taskInfo, submitHandler);
    }

    private handlePostNewQuestions = (event) => {
        this.props.httpService
            .post(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${this.state.activeSessionData.sessionId}/questions`, { questionContent: event })
            .then((response: any) => {
                if (response && response.data && response.data.id) {
                    this.setState({
                        activeSessionData: {
                            ...this.state.activeSessionData,
                            unansweredQuestions: [response.data, ...this.state.activeSessionData.unansweredQuestions],
                        },
                    });
                }
            })
            .catch((error) => {});
    };

    private handleClickAction = (event) => {
        this.props.httpService
            .patch(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${this.state.activeSessionData.sessionId}/questions/${event.q['id']}`, { action: event.actionValue })
            .then((response: any) => {
                if (response.data && response.data.id) {
                    let questions = this.state.activeSessionData[event.key];
                    const index = questions.findIndex((q) => q.id === response.data.id);
                    questions[index] = response.data;
                    this.setState((prevState) => ({
                        activeSessionData: {
                            ...prevState.activeSessionData,
                            ...questions,
                        },
                    }));
                }
            })
            .catch((error) => {});
    };

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        const { activeSessionData } = this.state;
        return (
            <div className="tab-content">
                <TabHeader activeSessionData={activeSessionData} refreshSession={this.getActiveSession} endSession={this.endActiveSession} showTaskModule={this.onShowTaskModule} />
                {activeSessionData.sessionId ? (
                    <Flex column>
                        <div className="tab-container">
                            <PostNewQuestions activeSessionData={activeSessionData} onPostNewQuestion={this.handlePostNewQuestions} />
                            {activeSessionData.unansweredQuestions.length > 0 || activeSessionData.answeredQuestions.length > 0 ? (
                                <TabQuestions onClickAction={this.handleClickAction} activeSessionData={activeSessionData} teamsTabContext={this.props.teamsTabContext} />
                            ) : (
                                <NoQuestionDesign />
                            )}
                        </div>
                    </Flex>
                ) : (
                    <CreateSession showTaskModule={this.onShowTaskModule} />
                )}
            </div>
        );
    }
}
// tslint:disable-next-line:export-name
export default withTranslation()(TabContent);
