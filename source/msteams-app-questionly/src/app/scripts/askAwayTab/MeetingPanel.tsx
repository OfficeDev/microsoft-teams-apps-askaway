// tslint:disable:no-relative-imports
import './index.scss';
import * as React from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import { Flex, Text, Button, Image, Loader, ArrowUpIcon } from '@fluentui/react-northstar';
import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web';
import { HttpService } from './shared/HttpService';
import { SignalRLifecycle } from './signalR/SignalRLifecycle';
import QuestionsList from './MeetingPanel/QuestionsList';
import NewQuestion from './MeetingPanel/NewQuestion';
import QnASessionHeader from './MeetingPanel/QnASessionHeader';
import { Helper } from './shared/Helper';
import { ClientDataContract } from '../../../../src/contracts/clientDataContract';
import { DataEventHandlerFactory } from './dataEventHandling/dataEventHandlerFactory';
import { IDataEvent } from 'msteams-app-questionly.common';

const EmptySessionImage = require('./../../web/assets/create_session.png');
/**
 * Properties for the MeetingPanel React component
 */
export interface MeetingPanelProps {
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
}
class MeetingPanel extends React.Component<MeetingPanelProps, MeetingPanelState> {
    /**
     * signalR component instance which is used later to refresh the connection.
     */
    private signalRComponent: SignalRLifecycle | null;
    private dataEventFactory: DataEventHandlerFactory;

    constructor(props) {
        super(props);
        this.dataEventFactory = new DataEventHandlerFactory();

        this.state = {
            activeSessionData: this.props.helper.createEmptyActiveSessionData(),
            showLoader: false,
            input: {
                title: '',
                description: '',
            },
            showNewUpdatesButton: false,
        };
    }

    componentDidMount() {
        this.updateContent();
    }

    /**
     * Shows loader and updates entire content of the screen.
     */
    private updateContent = () => {
        this.signalRComponent?.refreshConnection();
        this.setState({ showLoader: true });
        this.setState({ showNewUpdatesButton: false });
        this.getActiveSession();
    };

    /**
     * Updates only qna session content without showing loader.
     */
    private updateQnASessionContent = () => {
        this.setState({ showNewUpdatesButton: false });
        this.getActiveSession();
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
            this.setState({ activeSessionData: this.props.helper.createEmptyActiveSessionData() });
        } else {
            this.setState({ activeSessionData: sessionData });
        }
    };

    /**
     * To Identify Active Session
     */
    getActiveSession = () => {
        this.props.httpService
            .get(`/conversations/${this.props.teamsTabContext.chatId}/activesessions`)
            .then((response: any) => {
                if (response?.data?.length > 0) {
                    this.setState({
                        activeSessionData: response.data[0],
                    });
                }
                this.setState({ showLoader: false });
            })
            .catch((error) => {
                this.setState({ showLoader: false });
            });
    };

    /**
     * To End the active session
     * @param e - event
     */
    endActiveSession = (e) => {
        if (this.state?.activeSessionData?.sessionId) {
            this.setState({ showLoader: true });
            this.props.httpService
                .patch(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${this.state.activeSessionData.sessionId}`, { action: 'end' })
                .then((response: any) => {
                    this.setState({
                        showLoader: false,
                        activeSessionData: this.props.helper.createEmptyActiveSessionData(),
                    });
                })
                .catch((error) => {
                    this.setState({ showLoader: false });
                });
        }
    };

    /**
     * Display Create AMA session form
     */
    private onShowTaskModule = () => {
        let taskInfo: any = {
            fallbackUrl: '',
            appId: process.env.MicrosoftAppId,
            url: `https://${process.env.HostName}/askAwayTab/createsession.html?theme=${this.props.teamsTabContext.theme}&locale=${this.props.teamsTabContext.locale}`,
        };

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
     * Display's success and failure screens for AMA session
     */
    private showAlertModal(isSuccess = false) {
        let taskInfo: any = {
            fallbackUrl: '',
            appID: process.env.MicrosoftAppId,
            card: isSuccess ? this.successModal() : this.failureModal(),
        };
        microsoftTeams.tasks.startTask(taskInfo);
    }

    /**
     * Display's success screen when AMA session is successfully created
     */
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

    /**
     * display's failure screen when creating AMA session is unsuccessful
     */
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
     * Show this screen when no questions posted
     */
    private noQuestionDesign(image: string, text: string) {
        return (
            <div className="no-question">
                <Image className="create-session" alt="image" src={image} />
                <Flex.Item align="center">
                    <Text className="text-caption-panel" content={text} />
                </Flex.Item>
            </div>
        );
    }

    /**
     * Landing page for meeting panel
     */
    private createNewSessionLayout() {
        return (
            <React.Fragment>
                <QnASessionHeader title={'Start a Q&A session'} onClickRefreshSession={this.updateContent} onClickEndSession={this.endActiveSession} showToolBar={false} />
                <Flex hAlign="center" vAlign="center">
                    {this.noQuestionDesign(EmptySessionImage, 'Ready to field questions?')}
                    <Flex.Item align="center">
                        <Button className="button" onClick={this.onShowTaskModule}>
                            <Button.Content>Start a Q&A session</Button.Content>
                        </Button>
                    </Flex.Item>
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
                <QnASessionHeader title={sessionTitle} onClickRefreshSession={this.updateContent} onClickEndSession={this.endActiveSession} showToolBar={true} />
                {stateVal.activeSessionData.unansweredQuestions.length > 0 || stateVal.activeSessionData.answeredQuestions.length > 0 ? (
                    <QuestionsList activeSessionData={stateVal.activeSessionData} httpService={this.props.httpService} teamsTabContext={this.props.teamsTabContext} />
                ) : (
                    this.noQuestionDesign(EmptySessionImage, 'Q & A session is live...Ask away!')
                )}
                <NewQuestion
                    activeSessionData={stateVal.activeSessionData}
                    httpService={this.props.httpService}
                    teamsTabContext={this.props.teamsTabContext}
                    onAddNewQuestion={this.handleOnAddNewQuestion}
                />
            </React.Fragment>
        );
    };

    /**
     * The render() method to create the UI of the meeting panel
     */
    public render() {
        const stateVal = this.state;
        if (stateVal.showLoader) return <Loader label="Loading Meeting Information" />;

        return (
            <React.Fragment>
                <SignalRLifecycle
                    conversationId={this.props.teamsTabContext.chatId}
                    onEvent={this.updateEvent}
                    httpService={this.props.httpService}
                    appInsights={this.props.appInsights}
                    ref={(instance) => {
                        this.signalRComponent = instance;
                    }}
                />
                <div className="meeting-panel">
                    {this.state.showNewUpdatesButton && (
                        <Button onClick={this.updateQnASessionContent} className="newUpdatesButton">
                            <ArrowUpIcon xSpacing="after"></ArrowUpIcon>
                            <Button.Content className="newUpdatesButtonContent" content="New updates"></Button.Content>
                        </Button>
                    )}
                    {stateVal.activeSessionData.sessionId ? this.showSessionQuestions(stateVal) : this.createNewSessionLayout()}
                </div>
            </React.Fragment>
        );
    }
}
export default MeetingPanel;
