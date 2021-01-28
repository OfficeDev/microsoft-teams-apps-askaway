import './../index.scss';
import * as React from 'react';
import { Flex, Avatar, ThemePrepared, Text, Button } from '@fluentui/react-northstar';
import Badge from '../shared/Badge';
import { LikeIcon, ChevronDownMediumIcon, ChevronEndMediumIcon } from '@fluentui/react-icons-northstar';
import { LikeIconFilled } from '../shared/Icons/LikeIconFilled';
import { CONST } from '../shared/Constants';
import { useState } from 'react';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';
import { withTheme } from '../shared/WithTheme';

/**
 * Properties for the TabQuestions React component
 */

interface ThemeProps {
    theme: ThemePrepared;
}
export interface TabQuestionsProps {
    activeSessionData: ClientDataContract.QnaSession;
    teamsTabContext: microsoftTeams.Context;
    onClickAction: Function;
}
const TabQuestions: React.FunctionComponent<TabQuestionsProps & ThemeProps> = (props) => {
    const [isPendingTabOpen, setPendingTabOpen] = useState(true);

    const [isAnsweredTabOpen, setAnsweredTabOpen] = useState(true);

    const isUserLikedQuestion = (votes) => {
        return votes.includes(props.teamsTabContext.userObjectId);
    };

    const colorScheme = props.theme.siteVariables.colorScheme;

    /**
     * Display question list when session is active
     * @param questions - question data
     * @param questionType - answered/unanswered
     * @param tabValue - true/false
     */
    const showQuestions = (questions, questionType, tabValue) => {
        if (questions.length > 0) {
            return (
                <React.Fragment>
                    {showTitle(questionType)}
                    {((questionType === CONST.TAB_QUESTIONS.UNANSWERED_Q && tabValue) || (questionType === CONST.TAB_QUESTIONS.ANSWERED_Q && tabValue)) &&
                        questions.map((q) => {
                            return (
                                <div key={q.id} style={{ backgroundColor: colorScheme.default.background }} className="question-layout">
                                    <Flex gap="gap.small">
                                        <Flex.Item size="size.large">
                                            <div>
                                                <Flex vAlign="center" gap="gap.small" padding="padding.medium">
                                                    <Avatar name={q.author.name} />
                                                    <Text content={q.author.name} />
                                                    <Badge
                                                        styles={
                                                            CONST.TAB_QUESTIONS.UNANSWERED_Q === questionType
                                                                ? { backgroundColor: colorScheme.brand.background, color: colorScheme.brand.foreground4, fontSize: '10px', lineHeight: '12px' }
                                                                : { backgroundColor: colorScheme.green.background, color: colorScheme.green.foreground1, fontSize: '10px', lineHeight: '12px' }
                                                        }
                                                        text={CONST.TAB_QUESTIONS.UNANSWERED_Q === questionType ? 'PENDING' : 'ANSWERED'}
                                                    />
                                                </Flex>
                                            </div>
                                        </Flex.Item>
                                        <Flex.Item push>
                                            <Flex gap="gap.small" vAlign="center" styles={{ position: 'relative', right: '1.5rem' }}>
                                                <Button
                                                    disabled={questions.isActive && props.teamsTabContext.userObjectId === q.author.id ? false : true}
                                                    onClick={() =>
                                                        props.onClickAction({
                                                            q,
                                                            key: questionType,
                                                            actionValue: isUserLikedQuestion(q.voterAadObjectIds) ? CONST.TAB_QUESTIONS.DOWN_VOTE : CONST.TAB_QUESTIONS.UP_VOTE,
                                                        })
                                                    }
                                                    icon={isUserLikedQuestion(q.voterAadObjectIds) ? <LikeIconFilled /> : <LikeIcon outline />}
                                                    styles={{ marginRight: '0 !important' }}
                                                    iconOnly
                                                    text
                                                />
                                                <Text content={q.votesCount} />
                                            </Flex>
                                        </Flex.Item>
                                    </Flex>
                                    <Flex gap="gap.small" padding="padding.medium">
                                        <Text className="text-format" content={q.content} />
                                    </Flex>
                                </div>
                            );
                        })}
                </React.Fragment>
            );
        }
    };

    /**
     * Set down / end icon for question title
     * @param questionType - answered/unanswered
     */
    const setIcons = (questionType) => {
        if (questionType === CONST.TAB_QUESTIONS.UNANSWERED_Q) {
            return isPendingTabOpen ? (
                <ChevronDownMediumIcon size="small" className="svg-position" outline />
            ) : (
                <ChevronEndMediumIcon styles={{ stroke: colorScheme.default.foreground1 }} size="small" className="svg-position" />
            );
        }
        if (questionType === CONST.TAB_QUESTIONS.ANSWERED_Q) {
            return isAnsweredTabOpen ? (
                <ChevronDownMediumIcon size="small" className="svg-position" outline />
            ) : (
                <ChevronEndMediumIcon styles={{ stroke: colorScheme.default.foreground1 }} size="small" className="svg-position" />
            );
        }
    };

    /**
     * show / hide question list
     * @param questionType - answered/unanswered
     */
    const toggleQuestions = (questionType) => {
        if (questionType === CONST.TAB_QUESTIONS.UNANSWERED_Q) {
            setPendingTabOpen((currentPendingTabOpen) => !currentPendingTabOpen);
        }
        if (questionType === CONST.TAB_QUESTIONS.ANSWERED_Q) {
            setAnsweredTabOpen((currentAnsweredTabOpen) => !currentAnsweredTabOpen);
        }
    };

    const toggleClass = (questionType) => {
        if (questionType === CONST.TAB_QUESTIONS.UNANSWERED_Q && !isPendingTabOpen) {
            return 'btn-text-font-bold';
        }
        if (questionType === CONST.TAB_QUESTIONS.ANSWERED_Q && !isAnsweredTabOpen) {
            return 'btn-text-font-bold';
        }
    };

    const showTitle = (questionType) => {
        return (
            <Flex className="padding-none" gap="gap.small" padding="padding.medium" vAlign="center">
                <Button
                    className={`padding-none ${toggleClass(questionType)}`}
                    icon={setIcons(questionType)}
                    text
                    iconPosition="after"
                    content={questionType === CONST.TAB_QUESTIONS.UNANSWERED_Q ? 'Pending Questions' : 'Answered Questions'}
                    onClick={() => {
                        toggleQuestions(questionType);
                    }}
                />
            </Flex>
        );
    };

    return (
        <div className="question-container">
            {showQuestions(props.activeSessionData.answeredQuestions, CONST.TAB_QUESTIONS.ANSWERED_Q, isAnsweredTabOpen)}
            {showQuestions(props.activeSessionData.unansweredQuestions, CONST.TAB_QUESTIONS.UNANSWERED_Q, isPendingTabOpen)}
        </div>
    );
};
export default withTheme(TabQuestions);
