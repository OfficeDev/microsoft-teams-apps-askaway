// tslint:disable:no-relative-imports
import './index.scss';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import * as microsoftTeams from '@microsoft/teams-js';
import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web';
import { Flex, Loader } from '@fluentui/react-northstar';
import { HttpService } from './shared/HttpService';
import { Helper } from './shared/Helper';
import { TFunction } from 'i18next';
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
    openSwitchSessionsTaskModule,
} from './task-modules-utility/taskModuleHelper';
import { ParticipantRoles } from '../../../enums/ParticipantRoles';
import { getCurrentParticipantRole } from './shared/meetingUtility';

export interface TabContentProps extends WithTranslation {
    teamsTabContext: microsoftTeams.Context;
    httpService: HttpService;
    appInsights: ApplicationInsights;
    helper: Helper;
}
export interface TabContentState {
    /**
     * Q&A session selected in the tab view.
     */
    selectedAmaSessionData: ClientDataContract.QnaSession;
    /**
     * current user's role in meeting.
     */
    userRole: ParticipantRoles;
    /**
     * Indicator to show loading experience when fetching data etc.
     */
    showLoader: boolean;
}

export class TabContent extends React.Component<TabContentProps, TabContentState> {
    public localize: TFunction;
    constructor(props) {
        super(props);
        this.onShowTaskModule = this.onShowTaskModule.bind(this);
        this.localize = this.props.t;
        this.state = {
            selectedAmaSessionData: this.props.helper.createEmptyActiveSessionData(),
            userRole: ParticipantRoles.Attendee,
            showLoader: false,
        };
    }

    componentDidMount() {
        this.updateContent();
    }

    /**
     * Fetches data needed to update session and user information.
     */
    private updateContent = async () => {
        this.setState({ showLoader: true });
        await this.updateUserRole();
        await this.getActiveSession();
        this.setState({ showLoader: false });
    };

    /**
     * Fetches current user role and sets state accordingly.
     */
    private async updateUserRole() {
        try {
            const userRole = await getCurrentParticipantRole(this.props.httpService, this.props.teamsTabContext.chatId);
            this.setState({ userRole: userRole });
        } catch (error) {
            // TODO: handle this as part of error handling story, Task:1475400.
            this.props.appInsights.trackException({
                exception: error,
                severityLevel: SeverityLevel.Error,
                properties: {
                    meetingId: this.props.teamsTabContext.meetingId,
                    userAadObjectId: this.props.teamsTabContext.userObjectId,
                },
            });
        }
    }

    /**
     * To Identify Active Session
     */
    getActiveSession = async (): Promise<ClientDataContract.QnaSession | null> => {
        const response = await this.props.httpService.get(`/conversations/${this.props.teamsTabContext.chatId}/activesessions`);

        if (response?.data?.length > 0) {
            this.setState({
                selectedAmaSessionData: response.data[0],
            });
            return response.data[0];
        }

        return null;
    };

    /**
     * Opens task module for swiching sessions.
     */
    private openSwitchSessionsTaskModule = () => {
        let submitHandler = (err: any, result: any) => {
            if (result) {
                this.setState({ selectedAmaSessionData: result });
            }
        };

        openSwitchSessionsTaskModule(this.props.t, submitHandler, this.props.teamsTabContext.chatId, this.state.selectedAmaSessionData.sessionId, this.props.teamsTabContext.theme);
    };

    /**
     * Takes user through end session journey, prompts end qna session message and calls end session callback if necessary.
     */
    private handleEndQnaSessionFlow = () => {
        handleEndQnASessionFlow(this.localize, this.endActiveSession);
    };

    /**
     * Ends active ama session.
     */
    private endActiveSession = async (e?: any) => {
        try {
            const activeSessionData = await this.getActiveSession();

            if (!activeSessionData) {
                throw new Error('No active session to end.');
            }

            await this.props.httpService.patch(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${activeSessionData.sessionId}`, { action: 'end' });
            this.setState((prevState) => ({
                selectedAmaSessionData: {
                    ...prevState.selectedAmaSessionData,
                    isActive: false,
                },
            }));
            handleTaskModuleResponseForEndQnASessionFlow(this.localize);
        } catch (error) {
            handleTaskModuleErrorForEndQnASessionFlow(this.localize, error);
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
                            handleTaskModuleResponseForSuccessfulCreateQnASessionFlow(this.localize);
                            this.setState({
                                selectedAmaSessionData: response.data,
                            });
                        } else {
                            handleTaskModuleErrorForCreateQnASessionFlow(this.localize, new Error('Invalid response'), this.endActiveSession);
                        }
                    })
                    .catch((error) => {
                        handleTaskModuleErrorForCreateQnASessionFlow(this.localize, error, this.endActiveSession);
                    });
            }
        };

        openStartQnASessionTaskModule(this.props.t, submitHandler, this.props.teamsTabContext.locale, this.props.teamsTabContext.theme);
    };

    private handlePostNewQuestions = (event) => {
        this.props.httpService
            .post(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${this.state.selectedAmaSessionData.sessionId}/questions`, { questionContent: event })
            .then((response: any) => {
                if (response && response.data && response.data.id) {
                    this.setState({
                        selectedAmaSessionData: {
                            ...this.state.selectedAmaSessionData,
                            unansweredQuestions: [response.data, ...this.state.selectedAmaSessionData.unansweredQuestions],
                        },
                    });
                }
            })
            .catch((error) => {});
    };

    private validateClickAction = (event) => {
        this.props.httpService
            .patch(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${this.state.selectedAmaSessionData.sessionId}/questions/${event.question['id']}`, { action: event.actionValue })
            .then((response: any) => {
                if (response.data && response.data.id) {
                    let questions = this.state.selectedAmaSessionData[event.key];
                    const index = questions.findIndex((q) => q.id === response.data.id);
                    questions[index] = response.data;
                    this.setState((prevState) => ({
                        selectedAmaSessionData: {
                            ...prevState.selectedAmaSessionData,
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
        if (this.state.showLoader) {
            return (
                <div className="tab-content">
                    <TabHeader
                        activeSessionData={this.state.selectedAmaSessionData}
                        showTaskModule={this.onShowTaskModule}
                        t={this.localize}
                        disableActions={true}
                        userRole={this.state.userRole}
                        refreshSession={this.updateContent}
                        endSession={this.handleEndQnaSessionFlow}
                        onSwitchSessionClick={this.openSwitchSessionsTaskModule}
                    />
                    <div className="centerContent">
                        <Loader label={this.props.t('tab.loaderText')} />
                    </div>
                </div>
            );
        }

        const { selectedAmaSessionData } = this.state;

        return (
            <div className="tab-content">
                <TabHeader
                    disableActions={false}
                    userRole={this.state.userRole}
                    t={this.localize}
                    activeSessionData={selectedAmaSessionData}
                    refreshSession={this.updateContent}
                    endSession={this.handleEndQnaSessionFlow}
                    showTaskModule={this.onShowTaskModule}
                    onSwitchSessionClick={this.openSwitchSessionsTaskModule}
                />
                {selectedAmaSessionData.sessionId ? (
                    <Flex column>
                        <div className="tab-container">
                            <PostNewQuestions t={this.localize} activeSessionData={selectedAmaSessionData} onPostNewQuestion={this.handlePostNewQuestions} />
                            {selectedAmaSessionData.unansweredQuestions.length > 0 || selectedAmaSessionData.answeredQuestions.length > 0 ? (
                                <TabQuestions t={this.localize} onClickAction={this.validateClickAction} activeSessionData={selectedAmaSessionData} teamsTabContext={this.props.teamsTabContext} />
                            ) : (
                                <NoQuestionDesign t={this.localize} />
                            )}
                        </div>
                    </Flex>
                ) : (
                    <TabCreateSession userRole={this.state.userRole} t={this.localize} showTaskModule={this.onShowTaskModule} />
                )}
            </div>
        );
    }
}
// tslint:disable-next-line:export-name
export default withTranslation()(TabContent);
