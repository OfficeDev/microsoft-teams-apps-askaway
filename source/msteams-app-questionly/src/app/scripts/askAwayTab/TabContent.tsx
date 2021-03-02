import { Button, Flex, Loader } from '@fluentui/react-northstar';
import { SeverityLevel } from '@microsoft/applicationinsights-web';
import * as microsoftTeams from '@microsoft/teams-js';
import { TFunction } from 'i18next';
import { IDataEvent } from 'msteams-app-questionly.common';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { ClientDataContract } from '../../../../src/contracts/clientDataContract';
import { ParticipantRoles } from '../../../enums/ParticipantRoles';
import { DataEventHandlerFactory } from './dataEventHandling/dataEventHandlerFactory';
import './index.scss';
import { Helper } from './shared/Helper';
import { HttpService } from './shared/HttpService';
import { getCurrentParticipantInfo } from './shared/meetingUtility';
import SignalRLifecycle from './signalR/SignalRLifecycle';
import NoQuestionDesign from './TabContent/NoQuestionDesign';
import PostNewQuestions from './TabContent/PostNewQuestions';
import TabCreateSession from './TabContent/TabCreateSession';
import TabHeader from './TabContent/TabHeader';
import TabQuestions from './TabContent/TabQuestions';
import {
    handleEndQnASessionFlow,
    handleTaskModuleErrorForCreateQnASessionFlow,
    handleTaskModuleErrorForEndQnASessionFlow,
    handleTaskModuleResponseForEndQnASessionFlow,
    handleTaskModuleResponseForSuccessfulCreateQnASessionFlow,
    invokeTaskModuleForGenericError,
    invokeTaskModuleForQuestionPostFailure,
    invokeTaskModuleForQuestionUpdateFailure,
    openStartQnASessionTaskModule,
    openSwitchSessionsTaskModule,
} from './task-modules-utility/taskModuleHelper';
import { CONST } from './shared/Constants';
import { trackException } from '../telemetryService';

export interface TabContentProps extends WithTranslation {
    teamsTabContext: microsoftTeams.Context;
    httpService: HttpService;
    helper: Helper;
    envConfig: { [key: string]: any };
}
export interface TabContentState {
    /**
     * State variable denoting if there are new updates on active qna session.
     */
    showNewUpdatesButton: boolean;
    /**
     * Q&A session selected in the tab view.
     */
    selectedAmaSessionData: ClientDataContract.QnaSession;
    /**
     * current user's role in meeting.
     */
    userRole: ParticipantRoles;
    /**
     * current user's name in meeting.
     */
    userName: string;
    /**
     * Indicator to show loading experience when fetching data etc.
     */
    showLoader: boolean;
}

export class TabContent extends React.Component<TabContentProps, TabContentState> {
    public localize: TFunction;
    private dataEventFactory: DataEventHandlerFactory;

    constructor(props) {
        super(props);
        this.dataEventFactory = new DataEventHandlerFactory();
        this.onShowTaskModule = this.onShowTaskModule.bind(this);
        this.localize = this.props.t;
        this.state = {
            selectedAmaSessionData: this.props.helper.createEmptyActiveSessionData(),
            userRole: ParticipantRoles.Attendee,
            userName: '',
            showLoader: false,
            showNewUpdatesButton: false,
        };
    }

    componentDidMount() {
        this.updateContent();
    }

    /**
     * Shows `new updates` button on the screen.
     */
    private showNewUpdatesButton = () => {
        this.setState({ showNewUpdatesButton: true });
    };

    /**
     * This function is triggered on events from signalR connection.
     * @param dataEvent - event received.
     */
    private updateEvent = (dataEvent: IDataEvent) => {
        const eventHandler = this.dataEventFactory.createHandler(dataEvent.type);
        if (eventHandler) {
            eventHandler.handleEvent(dataEvent, this.state.selectedAmaSessionData, this.refreshSession, this.showNewUpdatesButton, this.refreshSession);
        } else {
            trackException(new Error(`Cant find event handler for ${dataEvent.type}`), SeverityLevel.Error);
        }
    };

    /**
     * Fetches data needed to update session and user information.
     */
    private updateContent = async () => {
        this.setState({ showLoader: true });
        try {
            await this.refreshSession();
            await this.updateUserData();
        } catch (error) {
            this.logTelemetry(error);
            invokeTaskModuleForGenericError(this.props.t);
        }

        this.setState({ showLoader: false });
    };

    /**
     * Refreshes currently selected session, else if no session is selected, fetches active session.
     */
    refreshSession = async () => {
        this.setState({ showNewUpdatesButton: false });

        if (this.state.selectedAmaSessionData.sessionId) {
            const response = await this.props.httpService.get(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${this.state.selectedAmaSessionData.sessionId}`);

            if (response?.data) {
                this.setState({
                    selectedAmaSessionData: response.data,
                });
            }
        } else {
            await this.getActiveSession();
        }
    };

    private logTelemetry = (error: Error) => {
        trackException(error, SeverityLevel.Error, {
            meetingId: this.props.teamsTabContext?.meetingId,
            userAadObjectId: this.props.teamsTabContext?.userObjectId,
            conversationId: this.props.teamsTabContext?.chatId,
        });
    };

    /**
     * Fetches current user role and username and sets state accordingly.
     */
    private async updateUserData() {
        const userData = await getCurrentParticipantInfo(this.props.httpService, this.props.teamsTabContext.chatId);
        this.setState({
            userRole: userData.userRole as ParticipantRoles,
            userName: userData.userName,
        });
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
        } else {
            return null;
        }
    };

    /**
     * Opens task module for swiching sessions.
     */
    private openSwitchSessionsTaskModule = () => {
        let submitHandler = (err: any, result: any) => {
            if (result) {
                this.setState({ selectedAmaSessionData: result, showNewUpdatesButton: false });
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
    private endActiveSession = async () => {
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
                showNewUpdatesButton: false,
            }));
            handleTaskModuleResponseForEndQnASessionFlow(this.localize);
        } catch (error) {
            this.logTelemetry(error);
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
                        this.logTelemetry(error);
                        handleTaskModuleErrorForCreateQnASessionFlow(this.localize, error, this.endActiveSession);
                    });
            }
        };

        openStartQnASessionTaskModule(this.props.t, submitHandler, this.props.teamsTabContext.locale, this.props.teamsTabContext.theme);
    };

    private handlePostNewQuestions = async (event) => {
        try {
            const response = await this.props.httpService.post(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${this.state.selectedAmaSessionData.sessionId}/questions`, {
                questionContent: event,
            });

            if (response && response.data && response.data.id) {
                this.setState({
                    selectedAmaSessionData: {
                        ...this.state.selectedAmaSessionData,
                        unansweredQuestions: [response.data, ...this.state.selectedAmaSessionData.unansweredQuestions],
                    },
                });
            } else {
                throw new Error(`invalid response from post question api, response: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            invokeTaskModuleForQuestionPostFailure(this.props.t);

            this.logTelemetry(error);
        }
    };

    private validateClickAction = async (event) => {
        const userObjectId = this.props.teamsTabContext.userObjectId;

        /**
         * updates vote without api call.
         * @param revert - revert user vote if api call fails later.
         */
        const updateVote = (revert: boolean) => {
            if (event.actionValue === CONST.TAB_QUESTIONS.DOWN_VOTE || event.actionValue === CONST.TAB_QUESTIONS.UP_VOTE) {
                let questions = this.state.selectedAmaSessionData[event.key];
                const index = questions.findIndex((q) => q.id === event.question['id']);
                const question: ClientDataContract.Question = questions[index];

                if (userObjectId) {
                    if (!revert) {
                        if (event.actionValue === CONST.TAB_QUESTIONS.DOWN_VOTE) {
                            question.voterAadObjectIds = question.voterAadObjectIds.filter((userId) => userId != userObjectId);
                        } else if (event.actionValue === CONST.TAB_QUESTIONS.UP_VOTE && !question.voterAadObjectIds.includes(userObjectId)) {
                            question.voterAadObjectIds.push(userObjectId);
                        }
                    } else {
                        if (event.actionValue === CONST.TAB_QUESTIONS.UP_VOTE) {
                            question.voterAadObjectIds = question.voterAadObjectIds.filter((userId) => userId != userObjectId);
                        } else if (event.actionValue === CONST.TAB_QUESTIONS.DOWN_VOTE && !question.voterAadObjectIds.includes(userObjectId)) {
                            question.voterAadObjectIds.push(userObjectId);
                        }
                    }

                    this.setState((prevState) => ({
                        selectedAmaSessionData: {
                            ...prevState.selectedAmaSessionData,
                            ...questions,
                        },
                    }));
                }
            }
        };

        // Update vote without backend call, so that user does not have to wait till network round trip.
        updateVote(false);

        try {
            const response = await this.props.httpService.patch(
                `/conversations/${this.props.teamsTabContext.chatId}/sessions/${this.state.selectedAmaSessionData.sessionId}/questions/${event.question['id']}`,
                { action: event.actionValue }
            );

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
            } else {
                throw new Error(`invalid response from update question api. response: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            // Revert vote since api call has failed.
            updateVote(true);
            invokeTaskModuleForQuestionUpdateFailure(this.props.t);
            trackException(error, SeverityLevel.Error, {
                meetingId: this.props.teamsTabContext.meetingId,
                userAadObjectId: this.props.teamsTabContext.userObjectId,
                questionId: event?.question?.id,
                message: `Failure in updating question, update action ${event?.actionValue}`,
            });
        }
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
                <SignalRLifecycle
                    t={this.props.t}
                    enableLiveUpdates={this.state.selectedAmaSessionData?.isActive === true}
                    conversationId={this.props.teamsTabContext.chatId}
                    onEvent={this.updateEvent}
                    httpService={this.props.httpService}
                    envConfig={this.props.envConfig}
                    teamsTabContext={this.props.teamsTabContext}
                />
                {selectedAmaSessionData.sessionId ? (
                    <Flex column>
                        <div className="tab-container">
                            <PostNewQuestions t={this.localize} activeSessionData={selectedAmaSessionData} userName={this.state.userName} onPostNewQuestion={this.handlePostNewQuestions} />
                            {this.state.selectedAmaSessionData.isActive && this.state.showNewUpdatesButton && (
                                <div className="new-update-btn-wrapper">
                                    <Button primary size="medium" content={this.props.t('tab.updatemessage')} onClick={this.refreshSession} className="new-updates-button" />
                                </div>
                            )}
                            {selectedAmaSessionData.unansweredQuestions.length > 0 || selectedAmaSessionData.answeredQuestions.length > 0 ? (
                                <TabQuestions t={this.localize} onClickAction={this.validateClickAction} activeSessionData={selectedAmaSessionData} teamsTabContext={this.props.teamsTabContext} />
                            ) : (
                                <NoQuestionDesign isSessionActive={selectedAmaSessionData.isActive} t={this.localize} />
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
