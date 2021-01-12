// tslint:disable-next-line:no-relative-imports
import './index.scss';
// tslint:disable-next-line:no-relative-imports
import * as React from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import { Flex, Text, Button, Image, TextArea, FlexItem, SendIcon, Loader, Menu, menuAsToolbarBehavior, ShorthandCollection, MenuItemProps } from '@fluentui/react-northstar';
import { MoreIcon, LeaveIcon, RetryIcon } from '@fluentui/react-icons-northstar';
import { CONST } from './shared/ConfigVariables';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { HttpService } from './shared/HttpService';
import { SignalRLifecycle } from './signalR/SignalRLifecycle';
import ActiveSessionData from './MeetingPanel/activeSessionData';
const EmptySessionImage = require('./../../web/assets/create_session.png');
export interface MeetingPanelProps {
    teamsTabContext: any;
    httpService: HttpService;
    appInsights: ApplicationInsights;
    helper: any;
}
export interface MeetingPanelState {
    activeSessionData: any;
    showLoader: boolean;
    input: {
        title: string;
        description: string;
        postQuestion: string;
    };
}
class MeetingPanel extends React.Component<MeetingPanelProps, MeetingPanelState> {
    /**
     * signalR component instance which is used later to refresh the connection.
     */
    private signalRComponent: SignalRLifecycle | null;

    constructor(props) {
        super(props);
        this.state = {
            activeSessionData: null,
            showLoader: false,
            input: {
                title: '',
                description: '',
                postQuestion: '',
            },
        };
        this.showSessionQuestions = this.showSessionQuestions.bind(this);
    }

    componentDidMount() {
        this.getActiveSession();
    }

    /**
     * To Identify Active Session
     */
    private getActiveSession() {
        this.setState({ showLoader: true });
        this.props.httpService
            .get(`/conversations/${this.props.teamsTabContext.chatId}/activesessions`)
            .then((response: any) => {
                if (response && response.data && response.data.length > 0) {
                    this.setState({
                        activeSessionData: response.data[0],
                    });
                }
                this.setState({ showLoader: false });
            })
            .catch((error) => {
                this.setState({ showLoader: false });
            });
    }

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
                        activeSessionData: null,
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

        let submitHandler = (err: any, result: any) => {
            result = JSON.parse(result);
            if (result) {
                this.setState({
                    input: {
                        ...this.state.input,
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
                            this.showAlertModel(true);
                            this.setState({
                                activeSessionData: response.data,
                            });
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
    };

    /**
     * Display's success and failure screens for AMA session
     */
    private showAlertModel(isSuccess = false) {
        let taskInfo: any = {
            fallbackUrl: '',
            appID: process.env.MicrosoftAppId,
            card: isSuccess ? this.successModel() : this.failureModel(),
        };
        microsoftTeams.tasks.startTask(taskInfo);
    }

    /**
     * Display's success screen when AMA session is successfully created
     */
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

    /**
     * display's failure screen when creating AMA session is unsuccessful
     */
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
            <Flex hAlign="center" vAlign="center">
                {this.noQuestionDesign(EmptySessionImage, 'Ready to field questions?')}
                <Flex.Item align="center">
                    <Button className="button" onClick={this.onShowTaskModule}>
                        <Button.Content>Start a Q&A session</Button.Content>
                    </Button>
                </Flex.Item>
            </Flex>
        );
    }

    /**
     * Meeting panel header
     */
    showMenubar = (sessionTitle) => {
        const menuItems: ShorthandCollection<MenuItemProps> = [
            {
                icon: (
                    <MoreIcon
                        {...{
                            outline: false,
                        }}
                    />
                ),
                key: 'menuButton2',
                'aria-label': 'More options',
                indicator: false,
                menu: {
                    items: [
                        {
                            key: 'Refresh session',
                            content: 'Refresh session',
                            onClick: () => {
                                this.getActiveSession();
                            },
                            icon: <RetryIcon outline />,
                        },
                        {
                            key: 'End session',
                            content: 'End session',
                            onClick: this.endActiveSession,
                            icon: <LeaveIcon outline />,
                        },
                    ],
                },
            },
        ];

        return (
            <Flex vAlign="start">
                <Text className="session-title" content={sessionTitle} size="medium" />
                <FlexItem push>
                    <div className="menuHeader">
                        <Menu defaultActiveIndex={0} items={menuItems} iconOnly accessibility={menuAsToolbarBehavior} aria-label="Compose Editor" />
                    </div>
                </FlexItem>
            </Flex>
        );
    };

    /**
     * on Submit the questions
     */
    submitQuestion() {
        if (this.state.input.postQuestion) {
            this.props.httpService
                .post(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${this.state.activeSessionData.sessionId}/questions`, { questionContent: this.state.input.postQuestion })
                .then((response: any) => {
                    if (response && response.data && response.data.id) {
                        this.setState({
                            input: { ...this.state.input, postQuestion: '' },
                        });
                        this.setState({
                            activeSessionData: {
                                ...this.state.activeSessionData,
                                unansweredQuestions: [response.data, ...this.state.activeSessionData.unansweredQuestions],
                            },
                        });
                    }
                })
                .catch((error) => {});
        }
    }

    /**
     * This function is triggered on events from signalR connection.
     * @param dataEvent - event received.
     */
    private updateEvent = (dataEvent: any) => {
        switch (dataEvent.type) {
            case 'qnaSessionCreatedEvent': {
                // Check if `activeSessionData` is not populated already with right session data.
                // This can happen for user who has created the session.
                if (this.state.activeSessionData?.sessionId !== dataEvent.data.sessionId) {
                    this.setState({
                        activeSessionData: dataEvent.data,
                    });
                }
                break;
            }
            case 'qnaSessionEndedEvent': {
                this.setState({
                    activeSessionData: null,
                });
                break;
            }
        }
    };

    /**
     * Display session questions
     */
    showSessionQuestions(stateVal) {
        const sessionTitle = stateVal.activeSessionData.title ?? stateVal.input.title;
        return (
            <React.Fragment>
                {this.showMenubar(sessionTitle)}
                {stateVal.activeSessionData && (stateVal.activeSessionData.unansweredQuestions.length > 0 || stateVal.activeSessionData.answeredQuestions.length > 0) ? (
                    <ActiveSessionData activeSessionData={stateVal.activeSessionData} constValue={CONST} httpService={this.props.httpService} teamsTabContext={this.props.teamsTabContext} />
                ) : (
                    this.noQuestionDesign(EmptySessionImage, 'Q & A session is live...Ask away!')
                )}
                <div className="input-text-field">
                    <Flex gap="gap.small">
                        <TextArea
                            className="text-question"
                            inverted
                            fluid
                            maxLength={250}
                            placeholder="Type a question here"
                            onChange={(e) => this.onChangeQuestionInput(e)}
                            value={stateVal.input.postQuestion}
                        />
                        <FlexItem push>
                            <Button className="send-button" icon={<SendIcon size="large" onClick={() => this.submitQuestion()} />} text iconOnly />
                        </FlexItem>
                    </Flex>
                </div>
            </React.Fragment>
        );
    }

    /**
     * On change question input field
     * @param e - event
     */
    private onChangeQuestionInput(e) {
        this.setState({
            input: { ...this.state.input, postQuestion: e.target.value },
        });
    }

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
                <div className="meeting-panel">{stateVal.activeSessionData ? this.showSessionQuestions(stateVal) : this.createNewSessionLayout()}</div>
            </React.Fragment>
        );
    }
}
export default MeetingPanel;
