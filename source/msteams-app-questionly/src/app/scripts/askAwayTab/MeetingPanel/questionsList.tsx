// tslint:disable:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { useState, useMemo } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import { HttpService } from '../shared/HttpService';
import { AcceptIcon } from '@fluentui/react-icons-northstar';
import { Button } from '@fluentui/react-northstar';
import TabHeader from './TabHeader';
import Question from './Question';
import { CONST } from '../shared/Constants';
import { ClientDataContract } from '../../../../contracts/clientDataContract';
import { ParticipantRoles } from '../../../../enums/ParticipantRoles';

/**
 * Properties for the QuestionsList React component
 */
export interface QuestionsListProps {
    activeSessionData: ClientDataContract.QnaSession;
    httpService: HttpService;
    teamsTabContext: microsoftTeams.Context;
    t: Function;
    userRole: ParticipantRoles;
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
     * @param event - question, key, actionValue
     */
    const handleOnClickAction = (event) => {
        props.httpService
            .patch(`/conversations/${props.teamsTabContext.chatId}/sessions/${activeSessionData.sessionId}/questions/${event.question['id']}`, { action: event.actionValue })
            .then((response: any) => {
                if (response.data && response.data.id) {
                    let questions = activeSessionData[event.key];
                    const index = questions.findIndex((q) => q.id === response.data.id);
                    if (event.actionValue === CONST.TAB_QUESTIONS.MARK_ANSWERED && event.key === CONST.TAB_QUESTIONS.UNANSWERED_Q) {
                        questions.splice(index, 1);
                        setActiveSessionData({ ...activeSessionData, ...questions });
                        let questionsAnswered = activeSessionData[CONST.TAB_QUESTIONS.ANSWERED_Q];
                        questionsAnswered.unshift(response.data);
                        setActiveSessionData({ ...activeSessionData, ...questionsAnswered });
                    } else {
                        questions[index] = response.data;
                        setActiveSessionData({ ...activeSessionData, ...questions });
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

    const checkIsUserLikedQuestion = (event) => {
        const userId = props.teamsTabContext.userObjectId;
        if (event.idsArray.length > 0 && userId) {
            return event.idsArray.includes(userId);
        }
        return false;
    };

    const renderAcceptButton = (data: object) => {
        return (
            <div>
                <Button icon={<AcceptIcon />} onClick={() => handleOnClickAction(data)} className="like-icon-size answered-icon" iconOnly text />
            </div>
        );
    };
    return (
        <React.Fragment>
            <TabHeader t={props.t} onSelectActiveTab={setActiveLiveTab} tabActiveIndex={liveTab.defaultActiveIndex} />
            <div className="question-card">
                {liveTab.selectedTab === CONST.TAB_QUESTIONS.ANSWERED_Q &&
                    activeSessionData.answeredQuestions.map((question: ClientDataContract.Question) => {
                        const isUserLikedQuestion = checkIsUserLikedQuestion({ idsArray: question.voterAadObjectIds });
                        return (
                            <Question
                                questionId={question.id}
                                question={question}
                                onClickAction={handleOnClickAction}
                                isUserLikedQuestion={isUserLikedQuestion}
                                questionTab={CONST.TAB_QUESTIONS.ANSWERED_Q}
                                userId={props.teamsTabContext.userObjectId || ''}
                                userRole={props.userRole}
                            />
                        );
                    })}
                {liveTab.selectedTab === CONST.TAB_QUESTIONS.UNANSWERED_Q &&
                    activeSessionData.unansweredQuestions.map((question: ClientDataContract.Question) => {
                        const isUserLikedQuestion = checkIsUserLikedQuestion({ idsArray: question.voterAadObjectIds });
                        return (
                            <Question
                                questionId={question.id}
                                question={question}
                                onClickAction={handleOnClickAction}
                                isUserLikedQuestion={isUserLikedQuestion}
                                questionTab={CONST.TAB_QUESTIONS.UNANSWERED_Q}
                                userId={props.teamsTabContext.userObjectId || ''}
                                renderHoverElement={renderAcceptButton({ question, key: CONST.TAB_QUESTIONS.UNANSWERED_Q, actionValue: CONST.TAB_QUESTIONS.MARK_ANSWERED })}
                                userRole={props.userRole}
                            />
                        );
                    })}
            </div>
        </React.Fragment>
    );
};

export default QuestionsList;
