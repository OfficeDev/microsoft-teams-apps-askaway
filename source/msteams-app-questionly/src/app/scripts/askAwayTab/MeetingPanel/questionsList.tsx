// tslint:disable:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { useState, useMemo } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import { HttpService } from '../shared/HttpService';
import TabHeader from './TabHeader';
import Question from './Question';
import { CONST } from '../shared/Constants';
import { ClientDataContract } from '../../../../contracts/clientDataContract';
import { ParticipantRoles } from '../../../../enums/ParticipantRoles';
import { invokeTaskModuleForQuestionUpdateFailure } from '../task-modules-utility/taskModuleHelper';
import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web';
import { TFunction } from 'i18next';

/**
 * Properties for the QuestionsList React component
 */
export interface QuestionsListProps {
    activeSessionData: ClientDataContract.QnaSession;
    httpService: HttpService;
    teamsTabContext: microsoftTeams.Context;
    t: TFunction;
    userRole: ParticipantRoles;
    appInsights: ApplicationInsights;
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
            invokeTaskModuleForQuestionUpdateFailure(props.t);
            props.appInsights.trackException({
                exception: error,
                severityLevel: SeverityLevel.Error,
                properties: {
                    meetingId: props.teamsTabContext.meetingId,
                    userAadObjectId: props.teamsTabContext.userObjectId,
                    questionId: event?.question?.id,
                    message: `Failure in updating question, update action ${event?.actionValue}`,
                },
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
