// tslint:disable:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { Flex, Button, TextArea, FlexItem } from '@fluentui/react-northstar';
import { SendIcon } from '@fluentui/react-icons-northstar';
import { useState } from 'react';
import { HttpService } from '../shared/HttpService';
import * as microsoftTeams from '@microsoft/teams-js';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';

/**
 * Properties for the NewQuestion React component
 */
export interface NewQuestionProps {
    activeSessionData: ClientDataContract.QnaSession;
    httpService: HttpService;
    teamsTabContext: microsoftTeams.Context;
    onAddNewQuestion: Function;
}
const NewQuestion: React.FunctionComponent<NewQuestionProps> = (props) => {
    const [question, setQuestion] = useState('');

    /**
     * on Submit the questions
     */
    const submitQuestion = () => {
        if (question) {
            props.httpService
                .post(`/conversations/${props.teamsTabContext.chatId}/sessions/${props.activeSessionData.sessionId}/questions`, { questionContent: question })
                .then((response: any) => {
                    if (response && response.data && response.data.id) {
                        setQuestion('');
                        props.onAddNewQuestion(response.data);
                    }
                })
                .catch((error) => {});
        }
    };

    return (
        <div className="input-text-field">
            <Flex gap="gap.small">
                <TextArea
                    className="text-question"
                    inverted
                    fluid
                    maxLength={250}
                    placeholder="Type a question here"
                    onChange={(e) => {
                        setQuestion(e.target['value']);
                    }}
                    value={question}
                />
                <FlexItem push>
                    <Button className="send-button" icon={<SendIcon size="large" onClick={() => submitQuestion()} />} text iconOnly />
                </FlexItem>
            </Flex>
        </div>
    );
};
export default NewQuestion;
