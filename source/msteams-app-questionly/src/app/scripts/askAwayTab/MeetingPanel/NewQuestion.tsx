// tslint:disable:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { Flex, Button, TextArea, FlexItem } from '@fluentui/react-northstar';
import { SendIcon } from '@fluentui/react-icons-northstar';
import { useState } from 'react';
import { HttpService } from '../shared/HttpService';
import * as microsoftTeams from '@microsoft/teams-js';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';
import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web';
import { invokeTaskModuleForQuestionPostFailure } from '../task-modules-utility/taskModuleHelper';
import { TFunction } from 'i18next';

/**
 * Properties for the NewQuestion React component
 */
export interface NewQuestionProps {
    activeSessionData: ClientDataContract.QnaSession;
    httpService: HttpService;
    teamsTabContext: microsoftTeams.Context;
    onAddNewQuestion: Function;
    t: TFunction;
    appInsights: ApplicationInsights;
}
const NewQuestion: React.FunctionComponent<NewQuestionProps> = (props) => {
    const [question, setQuestion] = useState('');

    /**
     * on Submit the questions
     */
    const submitQuestion = async () => {
        try {
            if (question) {
                const response = await props.httpService.post(`/conversations/${props.teamsTabContext.chatId}/sessions/${props.activeSessionData.sessionId}/questions`, { questionContent: question });

                if (response && response.data && response.data.id) {
                    setQuestion('');
                    props.onAddNewQuestion(response.data);
                } else {
                    throw new Error(`invalid response from post question api, response: ${response.status} ${response.statusText}`);
                }
            }
        } catch (error) {
            invokeTaskModuleForQuestionPostFailure(props.t);

            props.appInsights.trackException({
                exception: error,
                severityLevel: SeverityLevel.Error,
                properties: {
                    meetingId: props.teamsTabContext.meetingId,
                    userAadObjectId: props.teamsTabContext.userObjectId,
                },
            });
        }
    };

    return (
        <Flex hAlign="center" vAlign="end" className="input-text-field" gap="gap.small">
            <FlexItem>
                <TextArea
                    className="text-question"
                    inverted
                    fluid
                    maxLength={250}
                    placeholder={props.t('meetingPanel.inputPlaceholder')}
                    onChange={(e) => {
                        setQuestion(e.target['value']);
                    }}
                    value={question}
                />
            </FlexItem>
            <FlexItem push>
                <Button icon={<SendIcon size="large" onClick={() => submitQuestion()} />} text iconOnly />
            </FlexItem>
        </Flex>
    );
};
export default NewQuestion;
