import { AcceptIcon, LikeIcon } from '@fluentui/react-icons-northstar';
import { Avatar, Button, Flex, Text } from '@fluentui/react-northstar';
import * as React from 'react';
import { useState } from 'react';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';
import { ParticipantRoles } from '../../../../enums/ParticipantRoles';
import { CONST } from '../shared/Constants';
import { LikeIconFilled } from '../shared/Icons/LikeIconFilled';
import { isPresenterOrOrganizer } from '../shared/meetingUtility';
import { ThemeProps, withTheme } from '../shared/WithTheme';
import './../index.scss';

type QuestionCompProps = {
    question: ClientDataContract.Question;
    isUserLikedQuestion: boolean;
    renderHoverElement?: any;
    questionId: string;
    questionTab: string;
    onClickAction: any;
    userId: string;
    userRole: ParticipantRoles;
    isSessionActive: boolean;
};

/**
 * Properties for the UnansweredQuestions React component
 */

const Question: React.FunctionComponent<QuestionCompProps & ThemeProps> = (props) => {
    const { question, isUserLikedQuestion, renderHoverElement, questionId, questionTab, onClickAction, userId } = props;
    const colorScheme = props.theme.siteVariables.colorScheme;
    const [isMouseHovered, setMouseHover] = useState(false);
    const [hoverColor, setHoverColor] = useState(colorScheme.default.foreground3);
    const [hoverBackgroundColor, setHoverBackgroundColor] = useState(colorScheme.default.background);
    const [disabledLikeButtonHoverColor, setDisabledLikeButtonHoverColor] = useState(colorScheme.default.foregroundDisabled1);

    const onMouseEnterChangeColor = () => {
        setMouseHover(true);
        setHoverColor(colorScheme.default.foreground4);
        setHoverBackgroundColor(colorScheme.default.backgroundHover);
        setDisabledLikeButtonHoverColor(colorScheme.default.foregroundDisabled);
    };

    const onMouseLeaveChangeColor = () => {
        setMouseHover(false);
        setHoverColor(colorScheme.default.foreground3);
        setHoverBackgroundColor(colorScheme.default.background);
        setDisabledLikeButtonHoverColor(colorScheme.default.foregroundDisabled1);
    };

    return (
        <div
            className="card-divider"
            style={{ color: hoverColor, backgroundColor: hoverBackgroundColor }}
            key={questionId}
            onMouseEnter={onMouseEnterChangeColor}
            onMouseLeave={onMouseLeaveChangeColor}
        >
            <Flex gap="gap.small" vAlign="center" className="card-layout">
                <Avatar size={'smaller'} name={question.author.name} />
                <Text title={question.author.name} truncated size="small" content={question.author.name} weight="regular" />
                <Flex.Item push>
                    <Flex className="action-buttons" gap="gap.smaller" vAlign="center">
                        {isPresenterOrOrganizer(props.userRole) && (
                            <Button
                                icon={isMouseHovered && renderHoverElement && <AcceptIcon styles={{ color: hoverColor }} />}
                                onClick={() =>
                                    onClickAction({
                                        question,
                                        key: CONST.TAB_QUESTIONS.UNANSWERED_Q,
                                        actionValue: CONST.TAB_QUESTIONS.MARK_ANSWERED,
                                    })
                                }
                                iconOnly
                                text
                            />
                        )}
                        <Button
                            disabled={userId === question.author.id || !props.isSessionActive}
                            onClick={() =>
                                onClickAction({
                                    question,
                                    key: questionTab,
                                    actionValue: isUserLikedQuestion ? CONST.TAB_QUESTIONS.DOWN_VOTE : CONST.TAB_QUESTIONS.UP_VOTE,
                                })
                            }
                            icon={
                                isUserLikedQuestion ? (
                                    <LikeIconFilled styles={{ color: hoverColor }} />
                                ) : (
                                    <LikeIcon styles={userId === question.author.id || !props.isSessionActive ? { color: disabledLikeButtonHoverColor } : { color: hoverColor }} outline />
                                )
                            }
                            iconOnly
                            text
                        />
                        <Text content={question.voterAadObjectIds.length} />
                    </Flex>
                </Flex.Item>
            </Flex>
            <Flex gap="gap.small" padding="padding.medium" className="question-padding">
                <Text className="card-body-question" size="medium" content={question.content} />
            </Flex>
        </div>
    );
};
export default withTheme(Question);
