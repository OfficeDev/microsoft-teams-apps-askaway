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
import { useState, useMemo } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import { HttpService } from '../shared/HttpService';
import { ActiveSessionData } from '../types';
import QuestionsTab from './questionsTab';
export interface QuestionsListProps {
    activeSessionData: ActiveSessionData;
    constValue: any;
    httpService: HttpService;
    teamsTabContext: microsoftTeams.Context;
}
export interface QuestionTab {
    selectedTab: string;
    defaultActiveIndex: number;
}
const QuestionsList: React.FunctionComponent<QuestionsListProps> = (props) => {
    const [activeSessionData, setActiveSessionData] = useState(
        props.activeSessionData
    );

    const [isHoveredQuestionIndex, setIsHoveredQuestionIndex] = useState(-1);

    const [liveTab, setLiveTab] = useState<QuestionTab>({
        selectedTab: props.constValue.TAB_QUESTIONS.UNANSWERED_Q,
        defaultActiveIndex: 0,
    });

    /**
     * component will receive props
     */
    useMemo(() => {
        setActiveSessionData(props.activeSessionData);
    }, [props]);

    /**
     * On click like icon in the answered and unanswered questions
     * @param question - answered / unanswered data
     * @param key - answeredQuestions / unansweredQuestions
     * @param actionValue - upvote/downvote/markAnswered
     */
    const onClickAction = (question, key, actionValue) => {
        props.httpService
            .patch(
                `/conversations/${props.teamsTabContext.chatId}/sessions/${activeSessionData.sessionId}/questions/${question['id']}`,
                { action: actionValue }
            )
            .then((response: any) => {
                if (response.data && response.data.id) {
                    const questions = activeSessionData[key];
                    const index = questions.findIndex(
                        (q) => q.id === response.data.id
                    );
                    questions.splice(index, 1);
                    if (
                        actionValue !==
                        props.constValue.TAB_QUESTIONS.MARK_ANSWERED
                    ) {
                        questions[index] = response.data;
                        activeSessionData[key] = questions;
                        setActiveSessionData(activeSessionData);
                    } else {
                        activeSessionData[key] = questions;
                        setActiveSessionData(activeSessionData);
                        if (
                            key === props.constValue.TAB_QUESTIONS.UNANSWERED_Q
                        ) {
                            let questionsAnswered =
                                activeSessionData[
                                    props.constValue.TAB_QUESTIONS.ANSWERED_Q
                                ];
                            questionsAnswered = [
                                response.data,
                                ...questionsAnswered,
                            ];
                            activeSessionData[
                                props.constValue.TAB_QUESTIONS.ANSWERED_Q
                            ] = questionsAnswered;
                        }
                        setActiveSessionData(activeSessionData);
                    }
                }
            })
            .catch((error) => {});
    };

    /**
     * Display pending questions
     * @param activeSessionData - activeSession array
     * @param key - answered/unanswered questions
     * @param stateVal - this.state
     */
    const liveQuestions = (
        activeSessionData: any,
        key: string,
        constValue: any
    ) => {
        return (
            activeSessionData[key].length > 0 && (
                <React.Fragment>
                    <div className="question-card">
                        {activeSessionData[key].map((q, index) => {
                            q['isUserLiked'] = isUserLikedQuestion(
                                q.voterAadObjectIds,
                                props.teamsTabContext.userObjectId
                            )
                                ? true
                                : false;
                            return (
                                <div
                                    className="card-divider"
                                    key={q.id}
                                    onMouseEnter={() => {
                                        setIsHoveredQuestionIndex(index);
                                    }}
                                    onMouseLeave={() => {
                                        setIsHoveredQuestionIndex(-1);
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
                                                        {isHoveredQuestionIndex ===
                                                            index &&
                                                            key !==
                                                                constValue
                                                                    .TAB_QUESTIONS
                                                                    .ANSWERED_Q && (
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
                                                                            onClickAction(
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
                                                                activeSessionData
                                                                    .hostUser
                                                                    .id ===
                                                                    q.author
                                                                        .id ||
                                                                props
                                                                    .teamsTabContext
                                                                    .userObjectId ===
                                                                    q.author.id
                                                            }
                                                            onClick={() =>
                                                                onClickAction(
                                                                    q,
                                                                    key,
                                                                    q.isUserLiked
                                                                        ? constValue
                                                                              .TAB_QUESTIONS
                                                                              .DOWN_VOTE
                                                                        : constValue
                                                                              .TAB_QUESTIONS
                                                                              .UP_VOTE
                                                                )
                                                            }
                                                            icon={
                                                                q.isUserLiked ? (
                                                                    <LikeIcon />
                                                                ) : (
                                                                    <LikeIcon
                                                                        outline
                                                                    />
                                                                )
                                                            }
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
    };

    const isUserLikedQuestion = (idsArray, userId) => {
        let response = false;
        if (idsArray.length > 0 && userId) {
            const isUserLiked = idsArray.includes(userId);
            if (isUserLiked) {
                response = true;
            }
        }
        return response;
    };

    /**
     * Get Live Tab Content on change
     * @param value - selectedTab
     */
    const setActiveLiveTab = (value) => {
        setLiveTab({
            ...liveTab,
            selectedTab: value,
        });
    };

    return (
        <React.Fragment>
            <QuestionsTab
                constValue={props.constValue}
                onSelectActiveTab={setActiveLiveTab}
            />
            {liveQuestions(
                activeSessionData,
                liveTab.selectedTab ===
                    props.constValue.TAB_QUESTIONS.UNANSWERED_Q
                    ? props.constValue.TAB_QUESTIONS.UNANSWERED_Q
                    : props.constValue.TAB_QUESTIONS.ANSWERED_Q,
                props.constValue
            )}
        </React.Fragment>
    );
};

export default QuestionsList;
