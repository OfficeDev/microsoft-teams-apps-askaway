// tslint:disable-next-line:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { Card, Flex, Button, Text, Avatar } from '@fluentui/react-northstar';
import { LikeIcon, AcceptIcon } from '@fluentui/react-icons-northstar';
import { LikeIconFilled } from './../shared/Icons/LikeIconFilled';
import * as microsoftTeams from '@microsoft/teams-js';
import { CONST } from './../shared/Constants';
import { useState, useEffect } from 'react';

/**
 * Properties for the UnansweredQuestions React component
 */
export interface QuestionProps {
    questionData: Array<any>;
    teamsTabContext: microsoftTeams.Context;
    isUserLikedQuestion: Function;
    onClickAction: Function;
    questionTab: string;
}
const Question: React.FunctionComponent<QuestionProps> = (props) => {
    const [isHoveredQuestionIndex, setIsHoveredQuestionIndex] = useState(-1);

    const renderAcceptButton = (data: object) => {
        return (
            <div>
                <Button icon={<AcceptIcon />} onClick={() => props.onClickAction(data)} className="like-icon-size answered-icon" iconOnly text />
            </div>
        );
    };

    return (
        <React.Fragment>
            {props.questionData.length > 0 && (
                <div className="question-card">
                    {props.questionData.map((q, index) => {
                        q['isUserLiked'] = props.isUserLikedQuestion({ idsArray: q.voterAadObjectIds, userId: props.teamsTabContext.userObjectId });
                        return (
                            <div
                                className="card-divider"
                                key={q.id}
                                onMouseEnter={() => {
                                    if (props.questionTab === CONST.TAB_QUESTIONS.UNANSWERED_Q) {
                                        setIsHoveredQuestionIndex(index);
                                    }
                                }}
                                onMouseLeave={() => {
                                    if (props.questionTab === CONST.TAB_QUESTIONS.UNANSWERED_Q) {
                                        setIsHoveredQuestionIndex(-1);
                                    }
                                }}
                            >
                                <Card aria-roledescription="card avatar" className="card-layout">
                                    <Card.Header fitted>
                                        <Flex gap="gap.small">
                                            <Avatar size={'smaller'} name={q.author.name} />
                                            <Flex>
                                                <Text className="author-name" content={q.author.name} weight="regular" />
                                                <Flex vAlign="center" className="like-icon">
                                                    {isHoveredQuestionIndex === index &&
                                                        props.questionTab === CONST.TAB_QUESTIONS.UNANSWERED_Q &&
                                                        renderAcceptButton({ question: q, key: CONST.TAB_QUESTIONS.UNANSWERED_Q, actionValue: CONST.TAB_QUESTIONS.MARK_ANSWERED })}
                                                    <Button
                                                        // disabled={props.teamsTabContext.userObjectId === q.author.id}
                                                        onClick={() =>
                                                            props.onClickAction({
                                                                question: q,
                                                                key: CONST.TAB_QUESTIONS.UNANSWERED_Q,
                                                                actionValue: q.isUserLiked ? CONST.TAB_QUESTIONS.DOWN_VOTE : CONST.TAB_QUESTIONS.UP_VOTE,
                                                            })
                                                        }
                                                        icon={q.isUserLiked ? <LikeIconFilled /> : <LikeIcon outline />}
                                                        className="like-icon-size"
                                                        iconOnly
                                                        text
                                                    />
                                                    <Text content={q.votesCount} />
                                                </Flex>
                                            </Flex>
                                        </Flex>
                                    </Card.Header>
                                    <Card.Body>
                                        <Text content={q.content} className="card-body-question" />
                                    </Card.Body>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            )}
        </React.Fragment>
    );
};
export default Question;
