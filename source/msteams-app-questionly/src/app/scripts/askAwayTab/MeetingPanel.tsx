// tslint:disable:no-relative-imports
import './index.scss';
import * as React from 'react';
import { ArrowUpIcon, Flex, Button, Loader, FlexItem } from '@fluentui/react-northstar';
import {
    handleTaskModuleErrorForCreateQnASessionFlow,
    handleTaskModuleErrorForEndQnASessionFlow,
    handleTaskModuleResponseForSuccessfulCreateQnASessionFlow,
    openStartQnASessionTaskModule,
    handleEndQnASessionFlow,
    invokeTaskModuleForGenericError,
} from './task-modules-utility/taskModuleHelper';
import * as microsoftTeams from '@microsoft/teams-js';
import { withTranslation, WithTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web';
import { HttpService } from './shared/HttpService';
import SignalRLifecycle from './signalR/SignalRLifecycle';
import QuestionsList from './MeetingPanel/QuestionsList';
import NewQuestion from './MeetingPanel/NewQuestion';
import QnASessionHeader from './MeetingPanel/QnASessionHeader';
import { Helper } from './shared/Helper';
import { ClientDataContract } from '../../../../src/contracts/clientDataContract';
import { DataEventHandlerFactory } from './dataEventHandling/dataEventHandlerFactory';
import { IDataEvent } from 'msteams-app-questionly.common';
import { ParticipantRoles } from '../../../enums/ParticipantRoles';
import { getCurrentParticipantInfo, isPresenterOrOrganizer } from './shared/meetingUtility';
import EmptyTile from './MeetingPanel/EmptyTile';

const collaborationImage = require('./../../web/assets/collaboration.png');
const noSessionImageForAttendees = require('./../../web/assets/relax_and_wait.png');

/**
 * Properties for the MeetingPanel React component
 */
export interface MeetingPanelProps extends WithTranslation {
    teamsTabContext: microsoftTeams.Context;
    httpService: HttpService;
    appInsights: ApplicationInsights;
    helper: Helper;
}

/**
 * State for the MeetingPanel React component
 */
export interface MeetingPanelState {
    activeSessionData: ClientDataContract.QnaSession;
    showLoader: boolean;
    input: {
        title: string;
        description: string;
    };
    /**
     * state variable denoting if there are new updates on qna session.
     */
    showNewUpdatesButton: boolean;
    /**
     * current user's role in meeting.
     */
    userRole: ParticipantRoles;
    /**
     * boolean representing if any active session is ended.
     */
    isActiveSessionEnded: boolean;
}

export class MeetingPanel extends React.Component<MeetingPanelProps, MeetingPanelState> {
    public localize: TFunction;
    private dataEventFactory: DataEventHandlerFactory;

    constructor(props) {
        super(props);
        this.localize = this.props.t;
        this.dataEventFactory = new DataEventHandlerFactory();

        this.state = {
            activeSessionData: this.props.helper.createEmptyActiveSessionData(),
            showLoader: false,
            input: {
                title: '',
                description: '',
            },
            showNewUpdatesButton: false,
            userRole: ParticipantRoles.Attendee,
            isActiveSessionEnded: false,
        };
    }

    componentDidMount() {
        this.updateContent();
    }

    private logTelemetry = (error: Error) => {
        this.props.appInsights.trackException({
            exception: error,
            severityLevel: SeverityLevel.Error,
            properties: {
                meetingId: this.props.teamsTabContext?.meetingId,
                userAadObjectId: this.props.teamsTabContext?.userObjectId,
                conversationId: this.props.teamsTabContext?.chatId,
            },
        });
    };

    /**
     * Fetches current user role and sets state accordingly.
     */
    private async updateUserRole() {
        const userData = await getCurrentParticipantInfo(this.props.httpService, this.props.teamsTabContext.chatId);
        this.setState({ userRole: userData.userRole as ParticipantRoles });
    }

    /**
     * Shows loader and updates entire content of the screen.
     */
    private updateContent = async () => {
        this.setState({ showLoader: true });
        try {
            await this.getActiveSession();
            await this.updateUserRole();
        } catch (error) {
            this.logTelemetry(error);
            invokeTaskModuleForGenericError(this.props.t);
        }

        this.setState({ showNewUpdatesButton: false, showLoader: false });
    };

    /**
     * Updates only qna session content without showing loader.
     */
    private updateQnASessionContent = async () => {
        this.setState({ showNewUpdatesButton: false });
        try {
            await this.getActiveSession();
        } catch (error) {
            this.logTelemetry(error);
            invokeTaskModuleForGenericError(this.props.t);
        }
    };

    /**
     * Shows `new updates` button on the screen.
     */
    private showNewUpdatesButton = () => {
        this.setState({ showNewUpdatesButton: true });
    };

    /**
     * Updates current active session data.
     * @param sessionData - session data.
     */
    private updateActiveSessionData = (sessionData: ClientDataContract.QnaSession | null) => {
        if (sessionData === null) {
            this.setState({
                activeSessionData: this.props.helper.createEmptyActiveSessionData(),
                isActiveSessionEnded: true,
            });
        } else {
            this.setState({ activeSessionData: sessionData });
        }
    };

    /**
     * To Identify Active Session
     */
    getActiveSession = async () => {
        const response = await this.props.httpService.get(`/conversations/${this.props.teamsTabContext.chatId}/activesessions`);

        if (response?.data?.length > 0) {
            this.setState({
                activeSessionData: response.data[0],
            });
        } else {
            this.setState({ activeSessionData: this.props.helper.createEmptyActiveSessionData() });
        }
    };

    /**
     * To End the active session
     * @param e - event
     */
    endActiveSession = (e?: any) => {
        if (this.state?.activeSessionData?.sessionId) {
            this.setState({ showLoader: true });
            this.props.httpService
                .patch(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${this.state.activeSessionData.sessionId}`, { action: 'end' })
                .then((response: any) => {
                    this.setState({
                        showLoader: false,
                        isActiveSessionEnded: true,
                        activeSessionData: this.props.helper.createEmptyActiveSessionData(),
                    });
                })
                .catch((error) => {
                    this.logTelemetry(error);

                    handleTaskModuleErrorForEndQnASessionFlow(this.localize, error);
                    this.setState({ showLoader: false });
                });
        }
    };

    /**
     * Takes user through end session journey, prompts end qna session message and calls end session callback if necessary.
     */
    private handleEndQnaSessionFlow = () => {
        handleEndQnASessionFlow(this.localize, this.endActiveSession);
    };

    /**
     * Display Create AMA session form
     */
    private onShowTaskModule = () => {
        let submitHandler = async (err: any, result: any) => {
            result = JSON.parse(result);
            if (result) {
                this.setState({
                    input: {
                        title: result['title'],
                        description: result['description'],
                    },
                });
                const createSessionData = {
                    scopeId: this.props.teamsTabContext.chatId,
                    isChannel: false,
                };
                this.props.httpService
                    .post(`/conversations/${this.props.teamsTabContext.chatId}/sessions`, { ...this.state.input, ...createSessionData })
                    .then((response: any) => {
                        if (response && response['data'] && response['data']['sessionId']) {
                            handleTaskModuleResponseForSuccessfulCreateQnASessionFlow(this.localize);
                            this.setState({
                                activeSessionData: response.data,
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

    /**
     * Landing page for meeting panel
     */
    private createNewSessionLayout() {
        const isUserPresenterOrOrganizer = isPresenterOrOrganizer(this.state.userRole);
        let image: string;
        let text1: string;
        let text2: string | undefined;

        if (isUserPresenterOrOrganizer) {
            image = collaborationImage;
            text1 = this.localize('meetingPanel.welcomeText');
        } else {
            image = noSessionImageForAttendees;

            if (this.state.isActiveSessionEnded) {
                text1 = this.localize('meetingPanel.endSessionText');
                text2 = this.localize('meetingPanel.userThankyoutext');
            } else {
                text1 = this.localize('meetingPanel.attendeViewText');
            }
        }

        return (
            <React.Fragment>
                <QnASessionHeader
                    t={this.localize}
                    userRole={this.state.userRole}
                    title={this.localize('meetingPanel.panelTitle')}
                    onClickRefreshSession={this.updateContent}
                    onClickEndSession={this.handleEndQnaSessionFlow}
                    showToolBar={false}
                />
                <Flex hAlign="center" vAlign="center">
                    <div className="no-question">
                        <EmptyTile image={image} line1={text1} line2={text2} />
                        {isUserPresenterOrOrganizer && (
                            <Flex.Item align="center">
                                <Button className="button" onClick={this.onShowTaskModule}>
                                    <Button.Content>{this.localize('meetingPanel.createQnaSessionButton')}</Button.Content>
                                </Button>
                            </Flex.Item>
                        )}
                    </div>
                </Flex>
            </React.Fragment>
        );
    }

    /**
     * This function is triggered on events from signalR connection.
     * @param dataEvent - event received.
     */
    private updateEvent = (dataEvent: IDataEvent) => {
        const eventHandler = this.dataEventFactory.createHandler(dataEvent.type);
        if (eventHandler) {
            eventHandler.handleEvent(dataEvent, this.state.activeSessionData, this.updateQnASessionContent, this.showNewUpdatesButton, this.updateActiveSessionData);
        } else {
            this.props.appInsights.trackException({
                exception: new Error(`Cant find event handler for ${dataEvent.type}`),
                severityLevel: SeverityLevel.Error,
            });
        }
    };

    /**
     * Handle on add new question in the question component
     * @param event
     */
    handleOnAddNewQuestion = (event) => {
        this.setState({
            activeSessionData: {
                ...this.state.activeSessionData,
                unansweredQuestions: [event, ...this.state.activeSessionData.unansweredQuestions],
            },
        });
    };

    /**
     * Display session questions
     */
    showSessionQuestions = (stateVal) => {
        const sessionTitle = stateVal.activeSessionData.title ?? stateVal.input.title;
        return (
            <React.Fragment>
                <QnASessionHeader
                    t={this.localize}
                    userRole={this.state.userRole}
                    title={sessionTitle}
                    onClickRefreshSession={this.updateContent}
                    onClickEndSession={this.handleEndQnaSessionFlow}
                    showToolBar={true}
                />
                {stateVal.activeSessionData.unansweredQuestions.length > 0 || stateVal.activeSessionData.answeredQuestions.length > 0 ? (
                    <QuestionsList
                        appInsights={this.props.appInsights}
                        t={this.localize}
                        userRole={stateVal.userRole}
                        activeSessionData={stateVal.activeSessionData}
                        httpService={this.props.httpService}
                        teamsTabContext={this.props.teamsTabContext}
                    />
                ) : (
                    <div className="no-question">
                        <EmptyTile image={collaborationImage} line1={this.localize('meetingPanel.noQuestionsPosted')} line2={this.localize('meetingPanel.askAway')} />
                    </div>
                )}
                <FlexItem push>
                    <NewQuestion
                        appInsights={this.props.appInsights}
                        t={this.localize}
                        activeSessionData={stateVal.activeSessionData}
                        httpService={this.props.httpService}
                        teamsTabContext={this.props.teamsTabContext}
                        onAddNewQuestion={this.handleOnAddNewQuestion}
                    />
                </FlexItem>
            </React.Fragment>
        );
    };

    /**
     * The render() method to create the UI of the meeting panel
     */
    public render() {
        const stateVal = this.state;
        if (stateVal.showLoader)
            return (
                <div className="loader">
                    <Loader label={this.localize('meetingPanel.loaderText')} />
                </div>
            );
        return (
            <React.Fragment>
                <Flex column gap="gap.small" className="meeting-panel">
                    <SignalRLifecycle
                        enableLiveUpdates={true}
                        t={this.localize}
                        conversationId={this.props.teamsTabContext.chatId}
                        onEvent={this.updateEvent}
                        httpService={this.props.httpService}
                        appInsights={this.props.appInsights}
                    />
                    {this.state.showNewUpdatesButton && (
                        <Button primary onClick={this.updateQnASessionContent} className="newUpdatesButton">
                            <ArrowUpIcon xSpacing="after"></ArrowUpIcon>
                            <Button.Content className="newUpdatesButtonContent" content={this.localize('meetingPanel.updatemessage')}></Button.Content>
                        </Button>
                    )}
                    {stateVal.activeSessionData.sessionId ? this.showSessionQuestions(stateVal) : this.createNewSessionLayout()}
                </Flex>
            </React.Fragment>
        );
    }
}
export default withTranslation()(MeetingPanel);
