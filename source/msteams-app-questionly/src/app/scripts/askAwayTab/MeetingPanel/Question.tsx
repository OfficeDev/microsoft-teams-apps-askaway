// tslint:disable:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { Card, Flex, Button, Text, Avatar } from '@fluentui/react-northstar';
import { LikeIcon } from '@fluentui/react-icons-northstar';
import { LikeIconFilled } from '../shared/Icons/LikeIconFilled';
import { CONST } from '../shared/Constants';
import { useState } from 'react';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';

type QuestionCompProps = {
    question: ClientDataContract.Question;
    isUserLikedQuestion: boolean;
    renderHoverElement?: any;
    questionId: string;
    questionTab: string;
    onClickAction: any;
    userId: string;
};
/**
 * Properties for the UnansweredQuestions React component
 */

const Question: React.FunctionComponent<QuestionCompProps> = (props) => {
    const { question, isUserLikedQuestion, renderHoverElement, questionId, questionTab, onClickAction, userId } = props;
    const [isMouseHovered, setMouseHover] = useState(false);

    return (
        <div
            className="card-divider"
            key={questionId}
            onMouseEnter={() => {
                setMouseHover(true);
            }}
            onMouseLeave={() => {
                setMouseHover(false);
            }}
        >
            <Card aria-roledescription="card avatar" className="card-layout">
                <Card.Header fitted>
                    <Flex gap="gap.small">
                        <Avatar size={'smaller'} name={question.author.name} />
                        <Flex>
                            <Text className="author-name" content={question.author.name} weight="regular" />
                            <Flex vAlign="center" className="like-icon">
                                {isMouseHovered && renderHoverElement}
                                <Button
                                    disabled={userId === question.author.id}
                                    onClick={() =>
                                        onClickAction({
                                            question,
                                            key: questionTab,
                                            actionValue: isUserLikedQuestion ? CONST.TAB_QUESTIONS.DOWN_VOTE : CONST.TAB_QUESTIONS.UP_VOTE,
                                        })
                                    }
                                    icon={isUserLikedQuestion ? <LikeIconFilled /> : <LikeIcon outline />}
                                    className="like-icon-size"
                                    iconOnly
                                    text
                                />
                                <Text content={question.votesCount} />
                            </Flex>
                        </Flex>
                    </Flex>
                </Card.Header>
                <Card.Body>
                    <Text content={question.content} className="card-body-question" />
                </Card.Body>
            </Card>
        </div>
    );
};
export default Question;
