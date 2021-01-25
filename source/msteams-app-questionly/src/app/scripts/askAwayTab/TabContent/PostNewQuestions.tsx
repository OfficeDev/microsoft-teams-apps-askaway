import './../index.scss';
import * as React from 'react';
import { Flex, Text, Button, Image, FlexItem, Card, Divider, Avatar, TextArea } from '@fluentui/react-northstar';
import Badge from '../TabContent/Badge';
import { useState } from 'react';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';

/**
 * Properties for the PostNewQuestions React component
 */
export interface PostNewQuestionsProps {
    activeSessionData: ClientDataContract.QnaSession;
    onPostNewQuestion: Function;
}

const PostNewQuestions: React.FunctionComponent<PostNewQuestionsProps> = (props) => {
    const [question, setQuestion] = useState('');

    const formatDate = (dateTimeCreated) => {
        if (dateTimeCreated) {
            const date = new Date(dateTimeCreated);
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        } else {
            return ' ';
        }
    };

    const submitQuestion = () => {
        if (question) {
            props.onPostNewQuestion(question);
            setQuestion('');
        }
    };

    return (
        <div className="post-new-question">
            <Card aria-roledescription="card" className="card-layout">
                <Card.Header fitted>
                    <Flex gap="gap.small">
                        <Flex column>
                            <Badge className={props.activeSessionData.isActive ? 'badge--success' : 'badge--disabled'} text={props.activeSessionData.isActive ? 'Live' : 'Closed'} />
                            <Text
                                className="date-content-format"
                                content={`Created on ${formatDate(props.activeSessionData.dateTimeCreated)} by ${props.activeSessionData.hostUser.name}`}
                                size="small"
                            />
                        </Flex>
                    </Flex>
                </Card.Header>
                <Card.Body>
                    <Flex column gap="gap.small">
                        <Text className="session-title" weight="bold" content={props.activeSessionData.title} />
                    </Flex>
                </Card.Body>
                {props.activeSessionData.isActive && (
                    <Card.Footer>
                        <Divider />
                        <Flex gap="gap.small" vAlign="center">
                            <Avatar size="medium" name={props.activeSessionData.hostUser.name} />
                            <TextArea
                                fluid
                                maxLength={250}
                                placeholder="Type a question here"
                                onChange={(e) => {
                                    setQuestion(e.target['value']);
                                }}
                                value={question}
                            />
                            <FlexItem push>
                                <Button onClick={() => submitQuestion()} size="medium">
                                    <Button.Content>Post</Button.Content>
                                </Button>
                            </FlexItem>
                        </Flex>
                    </Card.Footer>
                )}
            </Card>
        </div>
    );
};
export default PostNewQuestions;
