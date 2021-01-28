// tslint:disable:no-relative-imports
import './index.scss';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import * as microsoftTeams from '@microsoft/teams-js';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { HttpService } from './shared/HttpService';
import { Helper } from './shared/Helper';
import { TFunction } from 'i18next';
import TabHeader from './TabContent/TabHeader';
import PostNewQuestions from './TabContent/PostNewQuestions';
import NoQuestionDesign from './TabContent/NoQuestionDesign';
import TabCreateSession from './TabContent/TabCreateSession';
import { ClientDataContract } from '../../../../src/contracts/clientDataContract';

export interface TabContentProps extends WithTranslation {
    teamsTabContext: microsoftTeams.Context;
    httpService: HttpService;
    appInsights: ApplicationInsights;
    helper: Helper;
}
export interface TabContentState {
    activeSessionData: ClientDataContract.QnaSession;
}

class TabContent extends React.Component<TabContentProps, TabContentState> {
    public localize: TFunction;
    constructor(props) {
        super(props);
        this.onShowTaskModule = this.onShowTaskModule.bind(this);
        this.localize = this.props.t;
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
                            text: this.localize('tab.successText'),
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
                            text: this.localize('tab.failureText'),
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
                    title: this.localize('tab.ok'),
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

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        const { activeSessionData } = this.state;
        return (
            <div className="tab-content">
                <TabHeader t={this.localize} refreshSession={this.getActiveSession} endSession={this.endActiveSession} />
                {activeSessionData.sessionId ? (
                    <React.Fragment>
                        <PostNewQuestions t={this.localize} activeSessionData={activeSessionData} />
                        <NoQuestionDesign t={this.localize} />
                    </React.Fragment>
                ) : (
                    <TabCreateSession t={this.localize} showTaskModule={this.onShowTaskModule} />
                )}
            </div>
        );
    }
}
// tslint:disable-next-line:export-name
export default withTranslation()(TabContent);
