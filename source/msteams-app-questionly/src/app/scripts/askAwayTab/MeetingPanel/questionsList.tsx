// tslint:disable-next-line:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { useState, useMemo } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import { HttpService } from '../shared/HttpService';
import { ActiveSessionData } from '../types';
import TabHeader from './TabHeader';
import AnsweredQuestions from './AnsweredQuestions';
import UnansweredQuestions from './UnansweredQuestions';
import { CONST } from '../shared/Constants';

/**
 * Properties for the QuestionsList React component
 */
export interface QuestionsListProps {
    activeSessionData: ActiveSessionData;
    httpService: HttpService;
    teamsTabContext: microsoftTeams.Context;
}
export interface QuestionTab {
    selectedTab: string;
    defaultActiveIndex: number;
}
const QuestionsList: React.FunctionComponent<QuestionsListProps> = (props) => {
    const [activeSessionData, setActiveSessionData] = useState(props.activeSessionData);

    const [liveTab, setLiveTab] = useState<QuestionTab>({
        selectedTab: CONST.TAB_QUESTIONS.UNANSWERED_Q,
        defaultActiveIndex: 0,
    });

    /**
     * component will receive props
     */
    useMemo(() => {
        setActiveSessionData(props.activeSessionData);
        setLiveTab(liveTab);
    }, [props]);

    /**
     * On click like icon in the answered and unanswered questions
     * @param question - answered / unanswered data
     * @param key - answeredQuestions / unansweredQuestions
     * @param actionValue - upvote/downvote/markAnswered
     */
    const handleOnClickAction = (event) => {
        props.httpService
            .patch(`/conversations/${props.teamsTabContext.chatId}/sessions/${activeSessionData.sessionId}/questions/${event.question['id']}`, { action: event.actionValue })
            .then((response: any) => {
                if (response.data && response.data.id) {
                    const questions = activeSessionData[event.key];
                    const index = questions.findIndex((q) => q.id === response.data.id);
                    questions.splice(index, 1);
                    if (event.actionValue !== CONST.TAB_QUESTIONS.MARK_ANSWERED) {
                        questions[index] = response.data;
                        activeSessionData[event.key] = questions;
                        setActiveSessionData(activeSessionData);
                    } else {
                        activeSessionData[event.key] = questions;
                        setActiveSessionData(activeSessionData);
                        if (event.key === CONST.TAB_QUESTIONS.UNANSWERED_Q) {
                            let questionsAnswered = activeSessionData[CONST.TAB_QUESTIONS.ANSWERED_Q];
                            questionsAnswered = [response.data, ...questionsAnswered];
                            activeSessionData[CONST.TAB_QUESTIONS.ANSWERED_Q] = questionsAnswered;
                        }
                        setActiveSessionData(activeSessionData);
                    }
                }
            })
            .catch((error) => {});
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

    const handleIsUserLikedQuestions = (event) => {
        let response = false;
        if (event.idsArray.length > 0 && event.userId) {
            const isUserLiked = event.idsArray.includes(event.userId);
            if (isUserLiked) {
                response = true;
            }
        }
        return response;
    };

    return (
        <React.Fragment>
            <TabHeader onSelectActiveTab={setActiveLiveTab} tabActiveIndex={liveTab.defaultActiveIndex} />
            {/* <AnsweredQuestions answeredQuesrions, onClickAction />
            <UnanswertedQuestions unansweredQuesrions, onClickAction, OnHoverAction/> */}
            {liveTab.selectedTab === CONST.TAB_QUESTIONS.ANSWERED_Q && (
                <AnsweredQuestions
                    answeredData={activeSessionData[CONST.TAB_QUESTIONS.ANSWERED_Q]}
                    isUserLikedQuestion={handleIsUserLikedQuestions}
                    teamsTabContext={props.teamsTabContext}
                    onClickAction={handleOnClickAction}
                />
            )}
            {liveTab.selectedTab === CONST.TAB_QUESTIONS.UNANSWERED_Q && (
                <UnansweredQuestions
                    unansweredData={activeSessionData[CONST.TAB_QUESTIONS.UNANSWERED_Q]}
                    isUserLikedQuestion={handleIsUserLikedQuestions}
                    teamsTabContext={props.teamsTabContext}
                    onClickAction={handleOnClickAction}
                />
            )}
        </React.Fragment>
    );
};

export default QuestionsList;
