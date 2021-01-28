// tslint:disable:no-relative-imports
import './index.scss';
import * as React from 'react';
import { withTranslation } from 'react-i18next';
import * as microsoftTeams from '@microsoft/teams-js';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { HttpService } from './shared/HttpService';
import {
    handleTaskModuleErrorForCreateQnASessionFlow,
    handleTaskModuleErrorForEndQnASessionFlow,
    handleTaskModuleResponseForSuccessfulCreateQnASessionFlow,
    handleTaskModuleResponseForEndQnASessionFlow,
    openStartQnASessionTaskModule,
    handleEndQnASessionFlow,
} from './task-modules-utility/taskModuleHelper';
import { ClientDataContract } from '../../../contracts/clientDataContract';
import { Helper } from './shared/Helper';
import TabHeader from './TabContent/TabHeader';
import PostNewQuestions from './TabContent/PostNewQuestions';
import NoQuestionDesign from './TabContent/NoQuestionDesign';
import TabCreateSession from './TabContent/TabCreateSession';

export interface TabContentProps {
    teamsTabContext: microsoftTeams.Context;
    httpService: HttpService;
    appInsights: ApplicationInsights;
    helper: Helper;
}
export interface TabContentState {
    activeSessionData: ClientDataContract.QnaSession;
}

class TabContent extends React.Component<TabContentProps, TabContentState> {
    constructor(props) {
        super(props);
        this.state = {
            activeSessionData: this.props.helper.createEmptyActiveSessionData(),
        };
    }

    componentDidMount() {
        this.getActiveSession();
    }

    /**
     * To Identify Active Session
     */
    getActiveSession = async (): Promise<ClientDataContract.QnaSession> => {
        const response = await this.props.httpService.get(`/conversations/${this.props.teamsTabContext.chatId}/activesessions`);

        if (response?.data?.length > 0) {
            this.setState({
                activeSessionData: response.data[0],
            });

            return response.data[0];
        } else {
            throw new Error('No active session to end.');
        }
    };

    /**
     * Takes user through end session journey, prompts end qna session message and calls end session callback if necessary.
     */
    private handleEndQnaSessionFlow = () => {
        handleEndQnASessionFlow(this.endActiveSession);
    };

    /**
     * Ends active ama session.
     */
    private endActiveSession = async (e?: any) => {
        try {
            const activeSessionData = await this.getActiveSession();
            await this.props.httpService.patch(`/conversations/${this.props.teamsTabContext.chatId}/sessions/${activeSessionData.sessionId}`, { action: 'end' });
            this.setState({
                activeSessionData: this.props.helper.createEmptyActiveSessionData(),
            });
            handleTaskModuleResponseForEndQnASessionFlow();
        } catch (error) {
            handleTaskModuleErrorForEndQnASessionFlow(error);
        }
    };

    private onShowTaskModule = () => {
        let submitHandler = (err: any, result: any) => {
            if (result && result['title'] && result['description']) {
                const createSessionData = {
                    title: result['title'],
                    description: result['description'],
                    scopeId: this.props.teamsTabContext.chatId,
                    isChannel: false,
                };

                this.props.httpService
                    .post(`/conversations/${this.props.teamsTabContext.chatId}/sessions`, createSessionData)
                    .then((response: any) => {
                        if (response && response['data'] && response['data']['sessionId']) {
                            handleTaskModuleResponseForSuccessfulCreateQnASessionFlow();
                            this.setState({
                                activeSessionData: response.data,
                            });
                        } else {
                            handleTaskModuleErrorForCreateQnASessionFlow(new Error('Invalid response'), this.endActiveSession);
                        }
                    })
                    .catch((error) => {
                        handleTaskModuleErrorForCreateQnASessionFlow(error, this.endActiveSession);
                    });
            }
        };

        openStartQnASessionTaskModule(submitHandler, this.props.teamsTabContext.locale, this.props.teamsTabContext.theme);
    };

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        const { activeSessionData } = this.state;
        return (
            <div className="tab-content">
                <TabHeader refreshSession={this.getActiveSession} endSession={this.handleEndQnaSessionFlow} />
                {activeSessionData.sessionId ? (
                    <React.Fragment>
                        <PostNewQuestions activeSessionData={activeSessionData} />
                        <NoQuestionDesign />
                    </React.Fragment>
                ) : (
                    <TabCreateSession showTaskModule={this.onShowTaskModule} />
                )}
            </div>
        );
    }
}
// tslint:disable-next-line:export-name
export default withTranslation()(TabContent);
