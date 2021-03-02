import { SeverityLevel } from '@microsoft/applicationinsights-web';
import * as microsoftTeams from '@microsoft/teams-js';
import { TFunction } from 'i18next';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { ClientDataContract } from '../../../../contracts/clientDataContract';
import { ParticipantRoles } from '../../../../enums/ParticipantRoles';
import { trackException } from '../../telemetryService';
import { CONST } from '../shared/Constants';
import { HttpService } from '../shared/HttpService';
import { invokeTaskModuleForQuestionUpdateFailure } from '../task-modules-utility/taskModuleHelper';
import './../index.scss';
import Question from './Question';
import TabHeader from './TabHeader';

/**
 * Properties for the QuestionsList React component
 */
export interface QuestionsListProps {
    activeSessionData: ClientDataContract.QnaSession;
    httpService: HttpService;
    teamsTabContext: microsoftTeams.Context;
    t: TFunction;
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
    const handleOnClickAction = async (event) => {
        const userObjectId = props.teamsTabContext.userObjectId;

        /**
         * updates vote without api call.
         * @param revert - revert user vote if api call fails later.
         */
        const updateVote = (revert: boolean) => {
            if (event.actionValue === CONST.TAB_QUESTIONS.DOWN_VOTE || event.actionValue === CONST.TAB_QUESTIONS.UP_VOTE) {
                let questions = activeSessionData[event.key];
                const index = questions.findIndex((q) => q.id === event.question['id']);
                const question: ClientDataContract.Question = questions[index];

                if (userObjectId) {
                    if (!revert) {
                        if (event.actionValue === CONST.TAB_QUESTIONS.DOWN_VOTE) {
                            question.voterAadObjectIds = question.voterAadObjectIds.filter((userId) => userId != userObjectId);
                        } else if (event.actionValue === CONST.TAB_QUESTIONS.UP_VOTE && !question.voterAadObjectIds.includes(userObjectId)) {
                            question.voterAadObjectIds.push(userObjectId);
                        }
                    } else {
                        if (event.actionValue === CONST.TAB_QUESTIONS.UP_VOTE) {
                            question.voterAadObjectIds = question.voterAadObjectIds.filter((userId) => userId != userObjectId);
                        } else if (event.actionValue === CONST.TAB_QUESTIONS.DOWN_VOTE && !question.voterAadObjectIds.includes(userObjectId)) {
                            question.voterAadObjectIds.push(userObjectId);
                        }
                    }

                    setActiveSessionData({ ...activeSessionData, ...questions });
                }
            }
        };

        // Update vote without backend call, so that user does not have to wait till network round trip.
        updateVote(false);

        try {
            const response = await props.httpService.patch(`/conversations/${props.teamsTabContext.chatId}/sessions/${activeSessionData.sessionId}/questions/${event.question['id']}`, {
                action: event.actionValue,
            });

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
            } else {
                throw new Error(`invalid response from update question api. response: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            // Revert vote since api call has failed.
            updateVote(true);
            invokeTaskModuleForQuestionUpdateFailure(props.t);
            trackException(error, SeverityLevel.Error, {
                meetingId: props.teamsTabContext.meetingId,
                userAadObjectId: props.teamsTabContext.userObjectId,
                questionId: event?.question?.id,
                message: `Failure in updating question, update action ${event?.actionValue}`,
            });
        }
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
                                isSessionActive={activeSessionData.isActive}
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
                                renderHoverElement={true}
                                userRole={props.userRole}
                                isSessionActive={activeSessionData.isActive}
                            />
                        );
                    })}
            </div>
        </React.Fragment>
    );
};

export default QuestionsList;
