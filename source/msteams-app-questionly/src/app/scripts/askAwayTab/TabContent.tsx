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
import TabCreateSession from './TabContent/TabCreateSession';
import { ClientDataContract } from '../../../../src/contracts/clientDataContract';
import {
    handleTaskModuleErrorForCreateQnASessionFlow,
    handleTaskModuleErrorForEndQnASessionFlow,
    handleTaskModuleResponseForSuccessfulCreateQnASessionFlow,
    handleTaskModuleResponseForEndQnASessionFlow,
    openStartQnASessionTaskModule,
    handleEndQnASessionFlow,
} from './task-modules-utility/taskModuleHelper';

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
    getActiveSession = async (): Promise<ClientDataContract.QnaSession> => {
        const response = await this.props.httpService.get(`/conversations/${this.props.teamsTabContext.chatId}/activesessions`);

        if (response?.data?.length > 0) {
            this.setState({
                activeSessionData: response.data[0],
            });

            return response.data[0];
        } else {
            throw new Error('No active session to end.');
        }
    };

    /**
     * Takes user through end session journey, prompts end qna session message and calls end session callback if necessary.
     */
    private handleEndQnaSessionFlow = () => {
        handleEndQnASessionFlow(this.endActiveSession);
    };

    /**
     * Ends active ama session.
     */
    private endActiveSession = async (e?: any) => {
        try {
            const activeSessionData = await this.getActiveSession();
            await this.props.httpService.patch(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${activeSessionData.sessionId}`, { action: 'end' });
            this.setState({
                activeSessionData: this.props.helper.createEmptyActiveSessionData(),
            });
            handleTaskModuleResponseForEndQnASessionFlow();
        } catch (error) {
            handleTaskModuleErrorForEndQnASessionFlow(error);
        }
    };

    private onShowTaskModule = () => {
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
                            handleTaskModuleResponseForSuccessfulCreateQnASessionFlow();
                            this.setState({
                                activeSessionData: response.data,
                            });
                        } else {
                            handleTaskModuleErrorForCreateQnASessionFlow(new Error('Invalid response'), this.endActiveSession);
                        }
                    })
                    .catch((error) => {
                        handleTaskModuleErrorForCreateQnASessionFlow(error, this.endActiveSession);
                    });
            }
        };

        openStartQnASessionTaskModule(submitHandler, this.props.teamsTabContext.locale, this.props.teamsTabContext.theme);
    };

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

    private validateClickAction = (event) => {
        this.props.httpService
            .patch(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${this.state.activeSessionData.sessionId}/questions/${event.question['id']}`, { action: event.actionValue })
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
                <TabHeader activeSessionData={activeSessionData} refreshSession={this.getActiveSession} endSession={this.handleEndQnaSessionFlow} showTaskModule={this.onShowTaskModule} />
                {activeSessionData.sessionId ? (
                    <Flex column>
                        <div className="tab-container">
                            <PostNewQuestions activeSessionData={activeSessionData} onPostNewQuestion={this.handlePostNewQuestions} />
                            {activeSessionData.unansweredQuestions.length > 0 || activeSessionData.answeredQuestions.length > 0 ? (
                                <TabQuestions onClickAction={this.validateClickAction} activeSessionData={activeSessionData} teamsTabContext={this.props.teamsTabContext} />
                            ) : (
                                <NoQuestionDesign />
                            )}
                        </div>
                    </Flex>
                ) : (
                    <TabCreateSession showTaskModule={this.onShowTaskModule} />
                )}
            </div>
        );
    }
}
// tslint:disable-next-line:export-name
export default withTranslation()(TabContent);
