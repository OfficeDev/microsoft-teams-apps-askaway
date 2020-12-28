// tslint:disable-next-line:no-relative-imports
import './index.scss';
// tslint:disable-next-line:no-relative-imports
import * as React from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import {
    Flex,
    Text,
    Button,
    Image,
    Input,
    FlexItem,
    SendIcon,
    Loader,
    Menu,
    menuAsToolbarBehavior,
    ShorthandCollection,
    MenuItemProps,
    Form,
    tabListBehavior,
    Card,
    Avatar,
} from '@fluentui/react-northstar';
import {
    MoreIcon,
    LeaveIcon,
    RetryIcon,
    LikeIcon,
} from '@fluentui/react-icons-northstar';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { HttpService } from './shared/HttpService';
import { SignalRLifecycle } from './signalR/SignalRLifecycle';

const EmptySessionImage = require('./../../web/assets/create_session.png');
// const EndSessionImage =  require('./../../web/assets/end_session.png');
export interface MeetingPanelProps {
    teamsData: any;
    httpService: HttpService;
    appInsights: ApplicationInsights;
    helper: any;
    constValue: any;
}
export interface MeetingPanelState {
    activeSessionData: any;
    showLoader: boolean;
    input: {
        title: string;
        description: string;
        postQuestion: any;
    };
    error: {
        isTitle: boolean;
        isDescription: boolean;
    };
    liveTab: {
        selectedTab: string;
        defaultActiveIndex: number;
    };
}
class MeetingPanel extends React.Component<
    MeetingPanelProps,
    MeetingPanelState
> {
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
            error: {
                isTitle: false,
                isDescription: false,
            },
            liveTab: {
                selectedTab: props.constValue.TAB_QUESTIONS.PENDING,
                defaultActiveIndex: props.constValue.TAB_QUESTIONS.ACTIVE_INDEX,
            },
        };
        this.onShowTaskModule = this.onShowTaskModule.bind(this);
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
            .get(`/conversations/${this.props.teamsData.chatId}/activesessions`)
            .then((response: any) => {
                console.log('res-active-session', response);
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
                .patch(
                    `/conversations/${this.props.teamsData.chatId}/sessions/${this.state.activeSessionData.sessionId}`,
                    { action: 'end' }
                )
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
    private onShowTaskModule() {
        let taskInfo: any = {
            fallbackUrl: '',
            appId: process.env.MicrosoftAppId,
            url: `https://${process.env.HostName}/askAwayTab/createsession.html?theme=${this.props.teamsData.theme}&locale=${this.props.teamsData.locale}`,
        };

        let submitHandler = (err: any, result: any) => {
            result = JSON.parse(result);
            if (result) {
                const stateInput = this.state;
                stateInput.input.title = result['title'];
                stateInput.input.description = result['description'];
                this.setState(stateInput);
                const createSessionData = {
                    scopeId: this.props.teamsData.chatId,
                    isChannel: false,
                };
                this.props.httpService
                    .post(
                        `/conversations/${this.props.teamsData.chatId}/sessions`,
                        { ...this.state.input, ...createSessionData }
                    )
                    .then((response: any) => {
                        if (
                            response &&
                            response['data'] &&
                            response['data']['sessionId']
                        ) {
                            this.showAlertModel(true);
                            this.setState({
                                activeSessionData: response.data,
                            });
                            console.log('state', this.state.activeSessionData);
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

    /**
     * Show this screen when no questions posted
     */
    private noQuestionDesign(image: string, text: string) {
        return (
            <div className="no-question">
                <Image
                    className="create-session"
                    alt="image"
                    styles={{ width: '17rem' }}
                    src={image}
                />
                <Flex.Item align="center">
                    <Text className="text-caption-panel" content={text} />
                </Flex.Item>
            </div>
        );
    }

    /**
     * Landing page for meeting panel
     */
    private crateNewSessionLayout() {
        return (
            <Flex hAlign="center" vAlign="center">
                {this.noQuestionDesign(
                    EmptySessionImage,
                    'Ready to field questions?'
                )}
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
    // tslint:disable-next-line:max-func-body-length
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
                            key: '5',
                            content: 'Refresh session',
                            onClick: () => {
                                this.getActiveSession();
                            },
                            icon: <RetryIcon outline />,
                        },
                        {
                            key: '8',
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
                <Text
                    styles={{
                        fontSize: '18px',
                        lineHeight: '21px',
                    }}
                    content={sessionTitle}
                    size="medium"
                />
                <FlexItem push>
                    <div className="menuHeader">
                        <Menu
                            defaultActiveIndex={0}
                            items={menuItems}
                            iconOnly
                            accessibility={menuAsToolbarBehavior}
                            aria-label="Compose Editor"
                        />
                    </div>
                </FlexItem>
            </Flex>
        );
    };

    /**
     * on Submit the questions
     * @param e
     */
    submitQuestions(e) {
        if (e && this.state.input.postQuestion) {
            this.props.httpService
                .post(
                    `/conversations/${this.props.teamsData.chatId}/sessions/${this.state.activeSessionData.sessionId}/questions`,
                    { questionContent: this.state.input.postQuestion }
                )
                .then((response: any) => {
                    console.log('resp', response);
                    if (response && response.status === 201) {
                        const stateValue = this.state;
                        stateValue.input.postQuestion = '';
                        this.setState(stateValue);
                        this.getActiveSession();
                    }
                })
                .catch((error) => {});
        }
    }

    getLiveTabPendingQ = () => {
        this.setState({
            liveTab: {
                ...this.state.liveTab,
                selectedTab: this.props.constValue.TAB_QUESTIONS.PENDING,
            },
        });
    };

    getLiveTabAnsweredQ = () => {
        this.setState({
            liveTab: {
                ...this.state.liveTab,
                selectedTab: this.props.constValue.TAB_QUESTIONS.ANSWERED,
            },
        });
    };

    private liveQuestionsPending(questions) {
        return (
            <div className="question-card">
                {questions.map((q, index) => {
                    return (
                        <div
                            style={{ borderBottom: '1px solid #fff' }}
                            key={q.index}
                        >
                            <Card
                                aria-roledescription="card avatar"
                                styles={{ width: '100%', padding: '0.5rem' }}
                            >
                                <Card.Header fitted>
                                    <Flex gap="gap.small">
                                        <Avatar
                                            size={'smaller'}
                                            name={q.userId.userName}
                                        />
                                        <Flex>
                                            <Text
                                                styles={{
                                                    fontSize: '12px',
                                                    lineHeight: '20px',
                                                }}
                                                content={q.userId.userName}
                                                weight="regular"
                                            />
                                            <Flex
                                                vAlign="center"
                                                styles={{
                                                    position: 'absolute',
                                                    top: '0.3rem',
                                                    right: '1rem',
                                                }}
                                            >
                                                <Button
                                                    onClick={(e) =>
                                                        this.onClickPendingQLikeBtn(
                                                            e,
                                                            q
                                                        )
                                                    }
                                                    icon={<LikeIcon />}
                                                    styles={{
                                                        minWidth: '1rem',
                                                    }}
                                                    iconOnly
                                                    text
                                                    title=""
                                                />
                                                <Text content={0} />
                                            </Flex>
                                        </Flex>
                                    </Flex>
                                </Card.Header>
                                <Card.Body>
                                    <Text
                                        content={q.content}
                                        styles={{
                                            fontSize: '14px',
                                            lineHeight: '20px',
                                            marginTop: '0.75rem',
                                        }}
                                    />
                                </Card.Body>
                            </Card>
                        </div>
                    );
                })}
            </div>
        );
    }

    /**
     * On click pending like button
     * @param e - event
     * @param q - pending question data
     */
    private onClickPendingQLikeBtn(e, q) {
        if (e) {
            this.props.httpService
                .patch(
                    `/conversations/${this.props.teamsData.chatId}/sessions/${this.state.activeSessionData.sessionId}/questions/${q['_id']}`,
                    { action: 'upvote' }
                )
                .then((response: any) => {
                    console.log('resp', response);
                })
                .catch((error) => {});
        }
    }

    private liveQuestionsMenu(stateVal) {
        console.log('getLiveTabSelected', this.state.liveTab.selectedTab);
        const items = [
            {
                key: this.props.constValue.TAB_QUESTIONS.PENDING,
                content: 'Pending questions',
                onClick: this.getLiveTabPendingQ,
            },
            {
                key: this.props.constValue.TAB_QUESTIONS.ANSWERED,
                content: 'Answered questions',
                onClick: this.getLiveTabAnsweredQ,
            },
        ];
        return (
            <React.Fragment>
                <Menu
                    defaultActiveIndex={stateVal.liveTab.defaultActiveIndex}
                    items={items}
                    primary
                    underlined
                    accessibility={tabListBehavior}
                    aria-label="Today's events"
                    styles={{ borderBottom: 'none' }}
                />
            </React.Fragment>
        );
    }

    private liveQuestionsAnswered(answers) {
        return <p>Answered content</p>;
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
                if (
                    this.state.activeSessionData?.sessionId !==
                    dataEvent.data.sessionId
                ) {
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
     * When No question posted yets
     */
    postQuestions = (stateVal) => {
        const sessionTitle = stateVal.input.title
            ? stateVal.input.title
            : stateVal.activeSessionData.title;
        console.log('stateVal', stateVal);
        return (
            <React.Fragment>
                {this.showMenubar(sessionTitle)}
                {stateVal.activeSessionData.questions &&
                    stateVal.activeSessionData.questions.length > 0 && (
                        <React.Fragment>
                            {this.liveQuestionsMenu(stateVal)}

                            {stateVal.liveTab.selectedTab ===
                            this.props.constValue.TAB_QUESTIONS.PENDING
                                ? this.liveQuestionsPending(
                                      stateVal.activeSessionData.questions
                                  )
                                : this.liveQuestionsAnswered(
                                      stateVal.activeSessionData
                                  )}
                        </React.Fragment>
                    )}

                {stateVal.activeSessionData.questions &&
                    stateVal.activeSessionData.questions.length === 0 &&
                    this.noQuestionDesign(
                        EmptySessionImage,
                        'Q & A session is live...Ask away!'
                    )}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        width: '94%',
                    }}
                >
                    <Card styles={{ padding: '0rem', width: '100%' }}>
                        <Input
                            styles={{ background: 'none' }}
                            fluid
                            as="div"
                            onChange={(e) => this.appendInput(e)}
                            placeholder="Type a question here"
                            icon={
                                <Button
                                    icon={
                                        <SendIcon
                                            onClick={(e) =>
                                                this.submitQuestions(e)
                                            }
                                        />
                                    }
                                    text
                                    iconOnly
                                />
                            }
                            value={stateVal.input.postQuestion}
                        />
                    </Card>
                </div>
            </React.Fragment>
        );
    };

    appendInput(e) {
        const state = {
            input: {
                postQuestion: e.target.value,
            },
        };
        this.props.helper.appendInput(this, state);
    }

    /**
     * The render() method to create the UI of the meeting panel
     */
    public render() {
        const stateVal = this.state;
        if (stateVal.showLoader)
            return <Loader label="Loading Meeting Information" />;

        return (
            <React.Fragment>
                <SignalRLifecycle
                    conversationId={this.props.teamsData.chatId}
                    updateEvent={this.updateEvent}
                    httpService={this.props.httpService}
                    appInsights={this.props.appInsights}
                />
                <div className="meeting-panel">
                    {!stateVal.activeSessionData && (
                        <div>{this.crateNewSessionLayout()}</div>
                    )}
                    {stateVal.activeSessionData && (
                        <div>{this.postQuestions(stateVal)}</div>
                    )}
                </div>
            </React.Fragment>
        );
    }
}
export default MeetingPanel;
