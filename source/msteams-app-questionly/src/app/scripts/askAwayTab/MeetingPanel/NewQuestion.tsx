import { SendIcon } from '@fluentui/react-icons-northstar';
import { Button, Flex, FlexItem, TextArea } from '@fluentui/react-northstar';
import { SeverityLevel } from '@microsoft/applicationinsights-web';
import * as microsoftTeams from '@microsoft/teams-js';
import { TFunction } from 'i18next';
import * as React from 'react';
import { useState } from 'react';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';
import { trackException } from '../../telemetryService';
import { HttpService } from '../shared/HttpService';
import { invokeTaskModuleForQuestionPostFailure } from '../task-modules-utility/taskModuleHelper';
import './../index.scss';

/**
 * Properties for the NewQuestion React component
 */
export interface NewQuestionProps {
    activeSessionData: ClientDataContract.QnaSession;
    httpService: HttpService;
    teamsTabContext: microsoftTeams.Context;
    onAddNewQuestion: Function;
    t: TFunction;
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

            trackException(error, SeverityLevel.Error, {
                meetingId: props.teamsTabContext.meetingId,
                userAadObjectId: props.teamsTabContext.userObjectId,
            });
        }
    };

    const onChangeSetQuestion = (e) => {
        setQuestion(e.target['value']);
    };

    return (
        <Flex hAlign="center" vAlign="end" className="input-text-field" gap="gap.small">
            <FlexItem>
                <TextArea className="text-question" inverted fluid maxLength={250} placeholder={props.t('meetingPanel.inputPlaceholder')} onChange={onChangeSetQuestion} value={question} />
            </FlexItem>
            <FlexItem push>
                <Button icon={<SendIcon size="large" onClick={submitQuestion} />} text iconOnly />
            </FlexItem>
        </Flex>
    );
};
export default NewQuestion;
