// tslint:disable-next-line:no-relative-imports
import './../index.scss';
import * as React from 'react';
import {
    Flex,
    Text,
    Button,
    Menu,
    tabListBehavior,
    Card,
    Avatar,
} from '@fluentui/react-northstar';
import { LikeIcon, AcceptIcon } from '@fluentui/react-icons-northstar';
export interface ActiveSessionDataProps {
    activeSessionData: any;
    constValue: any;
    httpService: any;
    teamsTabContext: any;
}
export interface ActiveSessionDataState {
    activeSessionData: any;
    isHoveredQuestionIndex: number;
    liveTab: {
        selectedTab: string;
        defaultActiveIndex: number;
    };
}

class ActiveSessionData extends React.Component<
    ActiveSessionDataProps,
    ActiveSessionDataState
> {
    constructor(props) {
        super(props);
        this.state = {
            activeSessionData: props.activeSessionData,
            isHoveredQuestionIndex: -1,
            liveTab: {
                selectedTab: props.constValue.TAB_QUESTIONS.UNANSWERED_Q,
                defaultActiveIndex: 0,
            },
        };
    }

    componentWillReceiveProps(props) {
        this.setState({
            activeSessionData: {
                ...this.state.activeSessionData,
                ...props.activeSessionData,
            },
        });
    }

    /**
     * On hover show accepticon in the answered/unanswered questions
     * @param index - for loop index value
     */
    private setHoveredQuestionIndex(index: number) {
        this.setState({ isHoveredQuestionIndex: index });
    }

    /**
     * On click like icon in the answered and unanswered questions
     * @param question - pending question data
     * @param key - answeredQuestions / unansweredQuestions
     */
    private onClickAction(question, key, actionValue) {
        this.props.httpService
            .patch(
                `/conversations/${this.props.teamsTabContext.chatId}/sessions/${this.state.activeSessionData.sessionId}/questions/${question['id']}`,
                { action: actionValue }
            )
            .then((response: any) => {
                if (response.data && response.data.id) {
                    const questions = this.state.activeSessionData[key];
                    const index = questions.findIndex(
                        (q) => q.id === response.data.id
                    );
                    questions.splice(index, 1);
                    if (
                        actionValue !==
                        this.props.constValue.TAB_QUESTIONS.MARK_ANSWERED
                    ) {
                        questions[index] = response.data;
                        this.setState(questions);
                    } else {
                        this.setState(questions);
                        const activeSessionData = this.state.activeSessionData;
                        if (
                            key ===
                            this.props.constValue.TAB_QUESTIONS.UNANSWERED_Q
                        ) {
                            let questionsAnswered = this.state
                                .activeSessionData[
                                this.props.constValue.TAB_QUESTIONS.ANSWERED_Q
                            ];
                            questionsAnswered = [
                                response.data,
                                ...questionsAnswered,
                            ];
                            activeSessionData[
                                this.props.constValue.TAB_QUESTIONS.ANSWERED_Q
                            ] = questionsAnswered;
                        }
                        this.setState(activeSessionData);
                    }
                }
            })
            .catch((error) => {});
    }

    /**
     * Display pending questions
     * @param activeSessionData - activeSession array
     * @param key - answered/unanswered questions
     * @param stateVal - this.state
     */
    private liveQuestions(stateVal: any, key: string, constValue: any) {
        return (
            stateVal.activeSessionData[key].length > 0 && (
                <React.Fragment>
                    <div className="question-card">
                        {stateVal.activeSessionData[key].map((q, index) => {
                            return (
                                <div
                                    className="card-divider"
                                    key={q.id}
                                    onMouseEnter={() => {
                                        this.setHoveredQuestionIndex(index);
                                    }}
                                    onMouseLeave={() => {
                                        this.setHoveredQuestionIndex(-1);
                                    }}
                                >
                                    <Card
                                        aria-roledescription="card avatar"
                                        className="card-layout"
                                    >
                                        <Card.Header fitted>
                                            <Flex gap="gap.small">
                                                <Avatar
                                                    size={'smaller'}
                                                    name={q.author.name}
                                                />
                                                <Flex>
                                                    <Text
                                                        className="author-name"
                                                        content={q.author.name}
                                                        weight="regular"
                                                    />
                                                    <Flex
                                                        vAlign="center"
                                                        className="like-icon"
                                                    >
                                                        {stateVal.isHoveredQuestionIndex ===
                                                            index && (
                                                            <Button
                                                                icon={
                                                                    <AcceptIcon />
                                                                }
                                                                onClick={() => {
                                                                    if (
                                                                        key !==
                                                                        constValue
                                                                            .TAB_QUESTIONS
                                                                            .ANSWERED_Q
                                                                    ) {
                                                                        this.onClickAction(
                                                                            q,
                                                                            key,
                                                                            constValue
                                                                                .TAB_QUESTIONS
                                                                                .MARK_ANSWERED
                                                                        );
                                                                    }
                                                                }}
                                                                className="like-icon-size answered-icon"
                                                                iconOnly
                                                                text
                                                            />
                                                        )}
                                                        <Button
                                                            disabled={
                                                                stateVal
                                                                    .activeSessionData
                                                                    .hostUser
                                                                    .id ===
                                                                    q.author
                                                                        .id ||
                                                                this.props
                                                                    .teamsTabContext
                                                                    .userObjectId ===
                                                                    q.author.id
                                                            }
                                                            onClick={() =>
                                                                this.onClickAction(
                                                                    q,
                                                                    key,
                                                                    constValue
                                                                        .TAB_QUESTIONS
                                                                        .UP_VOTE
                                                                )
                                                            }
                                                            icon={<LikeIcon />}
                                                            className="like-icon-size"
                                                            iconOnly
                                                            text
                                                        />
                                                        <Text
                                                            content={
                                                                q.votesCount
                                                            }
                                                        />
                                                    </Flex>
                                                </Flex>
                                            </Flex>
                                        </Card.Header>
                                        <Card.Body>
                                            <Text
                                                content={q.content}
                                                className="card-body-question"
                                            />
                                        </Card.Body>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </React.Fragment>
            )
        );
    }

    /**
     * Get Live Tab Content on change
     * @param value - selectedTab
     */
    private setActiveLiveTab(value) {
        this.setState({
            liveTab: {
                ...this.state.liveTab,
                selectedTab: value,
            },
        });
    }

    /**
     * Display Pending and answered questions menu
     * @param stateVal - this.state
     */
    private liveQuestionsMenu(constValue) {
        const items = [
            {
                key: constValue.TAB_QUESTIONS.UNANSWERED_Q,
                content: 'Pending questions',
                onClick: () => {
                    this.setActiveLiveTab(
                        constValue.TAB_QUESTIONS.UNANSWERED_Q
                    );
                },
            },
            {
                key: constValue.TAB_QUESTIONS.ANSWERED_Q,
                content: 'Answered questions',
                onClick: () => {
                    this.setActiveLiveTab(constValue.TAB_QUESTIONS.ANSWERED_Q);
                },
            },
        ];
        return (
            <React.Fragment>
                <Menu
                    defaultActiveIndex={0}
                    items={items}
                    primary
                    underlined
                    accessibility={tabListBehavior}
                    aria-label="Today's events"
                    className="menu-bar"
                />
            </React.Fragment>
        );
    }

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        const stateVal = this.state;
        const constValue = this.props.constValue;
        return (
            <React.Fragment>
                {this.liveQuestionsMenu(constValue)}
                {stateVal.liveTab.selectedTab ===
                    constValue.TAB_QUESTIONS.UNANSWERED_Q &&
                    this.liveQuestions(
                        stateVal,
                        constValue.TAB_QUESTIONS.UNANSWERED_Q,
                        constValue
                    )}
                {stateVal.liveTab.selectedTab ===
                    constValue.TAB_QUESTIONS.ANSWERED_Q &&
                    this.liveQuestions(
                        stateVal,
                        constValue.TAB_QUESTIONS.ANSWERED_Q,
                        constValue
                    )}
            </React.Fragment>
        );
    }
}
export default ActiveSessionData;
