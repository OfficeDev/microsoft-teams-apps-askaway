// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ChevronDownMediumIcon, ChevronEndMediumIcon, LikeIcon } from '@fluentui/react-icons-northstar';
import { Avatar, Button, Flex, Text } from '@fluentui/react-northstar';
import * as React from 'react';
import { useState } from 'react';
import { TFunction } from 'i18next';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';
import Badge from '../shared/Badge';
import { CONST } from '../shared/Constants';
import { LikeIconFilled } from '../shared/Icons/LikeIconFilled';
import { ThemeProps, withTheme } from '../shared/WithTheme';
import './../index.scss';

interface IQuestionEventData {
    question: ClientDataContract.Question;
    key: string;
    actionValue: string;
}

/**
 * Properties for the TabQuestions React component
 */
export interface TabQuestionsProps {
    activeSessionData: ClientDataContract.QnaSession;
    teamsTabContext: microsoftTeams.Context;
    onClickAction: (event: IQuestionEventData) => Promise<void>;
    t: TFunction;
}
export const TabQuestions: React.FunctionComponent<TabQuestionsProps & ThemeProps> = (props) => {
    const [isPendingTabOpen, setPendingTabOpen] = useState(true);

    const [isAnsweredTabOpen, setAnsweredTabOpen] = useState(true);

    const isUserLikedQuestion = (votes: string[]) => {
        if (props.teamsTabContext.userObjectId) {
            return votes.includes(props.teamsTabContext.userObjectId);
        }
    };

    const colorScheme = props.theme.siteVariables.colorScheme;

    /**
     * Identifies user own questions
     * @param authorId - user id as 'string'
     */
    const isUserOwnQuestion = (authorId: string) => {
        return props.teamsTabContext.userObjectId === authorId;
    };

    /**
     * Display question list when session is active
     * @param questions - question data
     * @param questionType - 'answered' or 'unanswered' will be the value
     * @param isQuestionsTabExpanded - 'true' or 'false' will be the value
     */
    const showQuestions = (questions, questionType, isQuestionsTabExpanded, isActive) => {
        if (questions.length > 0) {
            return (
                <React.Fragment>
                    {showTitle(questionType)}
                    {((questionType === CONST.TAB_QUESTIONS.UNANSWERED_Q && isQuestionsTabExpanded) || (questionType === CONST.TAB_QUESTIONS.ANSWERED_Q && isQuestionsTabExpanded)) &&
                        questions.map((question) => {
                            return (
                                <div key={question.id} style={{ backgroundColor: colorScheme.default.background, border: `1px solid ${colorScheme.onyx.border1}` }} className="question-layout">
                                    <Flex gap="gap.small">
                                        <Flex vAlign="center" gap="gap.small" padding="padding.medium">
                                            <Avatar size="small" name={question.author.name} />
                                            <Text size="small" content={question.author.name} />
                                            <Flex vAlign="start" hAlign="start">
                                                <Badge
                                                    styles={
                                                        CONST.TAB_QUESTIONS.UNANSWERED_Q === questionType
                                                            ? { backgroundColor: colorScheme.brand.background, color: colorScheme.brand.foreground4, paddingBottom: '0.3rem' }
                                                            : { backgroundColor: colorScheme.green.background, color: colorScheme.green.foreground1, paddingBottom: '0.3rem' }
                                                    }
                                                    text={CONST.TAB_QUESTIONS.UNANSWERED_Q === questionType ? props.t('tab.pendingStatus') : props.t('tab.answeredStatus')}
                                                />
                                            </Flex>
                                        </Flex>
                                        <Flex.Item push>
                                            <Flex gap="gap.small" vAlign="center" styles={{ position: 'relative', right: '1.5rem' }}>
                                                <Button
                                                    disabled={isUserOwnQuestion(question.author.id) || !isActive}
                                                    onClick={() =>
                                                        props.onClickAction({
                                                            question,
                                                            key: questionType,
                                                            actionValue: isUserLikedQuestion(question.voterAadObjectIds) ? CONST.TAB_QUESTIONS.DOWN_VOTE : CONST.TAB_QUESTIONS.UP_VOTE,
                                                        })
                                                    }
                                                    icon={isUserLikedQuestion(question.voterAadObjectIds) ? <LikeIconFilled style={{ fill: colorScheme.brand.background }} /> : <LikeIcon outline />}
                                                    styles={{ marginRight: '0 !important' }}
                                                    iconOnly
                                                    text
                                                />
                                                <Text content={question.voterAadObjectIds.length} />
                                            </Flex>
                                        </Flex.Item>
                                    </Flex>
                                    <Flex gap="gap.small" padding="padding.medium" className="text-format">
                                        <Text size="medium" content={question.content} />
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
        const downMediumIcon = <ChevronDownMediumIcon size="small" className="svg-position" outline />;
        let response = <ChevronEndMediumIcon styles={{ stroke: colorScheme.default.foreground1 }} size="small" className="svg-position" />;
        if ((questionType === CONST.TAB_QUESTIONS.UNANSWERED_Q && isPendingTabOpen) || (questionType === CONST.TAB_QUESTIONS.ANSWERED_Q && isAnsweredTabOpen)) {
            response = downMediumIcon;
        }
        return response;
    };

    /**
     * show / hide question list
     * @param questionType - 'answered' or 'unanswered'
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
        if ((questionType === CONST.TAB_QUESTIONS.UNANSWERED_Q && !isPendingTabOpen) || (questionType === CONST.TAB_QUESTIONS.ANSWERED_Q && !isAnsweredTabOpen)) {
            return 'btn-text-font-bold';
        }
    };

    const showTitle = (questionType) => {
        return (
            <Flex className="padding-none" gap="gap.small" vAlign="center">
                <Button
                    className={`padding-none ${toggleClass(questionType)}`}
                    icon={setIcons(questionType)}
                    text
                    iconPosition="after"
                    content={questionType === CONST.TAB_QUESTIONS.UNANSWERED_Q ? props.t('tab.showPendingQuestions') : props.t('tab.showAnsweredQuestions')}
                    onClick={() => {
                        toggleQuestions(questionType);
                    }}
                />
            </Flex>
        );
    };

    return (
        <div className="question-container">
            {showQuestions(props.activeSessionData.answeredQuestions, CONST.TAB_QUESTIONS.ANSWERED_Q, isAnsweredTabOpen, props.activeSessionData.isActive)}
            {showQuestions(props.activeSessionData.unansweredQuestions, CONST.TAB_QUESTIONS.UNANSWERED_Q, isPendingTabOpen, props.activeSessionData.isActive)}
        </div>
    );
};
export default withTheme(TabQuestions);
