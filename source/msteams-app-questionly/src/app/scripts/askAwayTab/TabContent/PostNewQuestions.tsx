import './../index.scss';
import * as React from 'react';
import { Flex, Text, Button, FlexItem, Card, Divider, Avatar, TextArea, ThemePrepared } from '@fluentui/react-northstar';
import Badge from '../shared/Badge';
import { useState } from 'react';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';
import { withTheme } from '../shared/WithTheme';

let moment = require('moment');
interface ThemeProps {
    theme: ThemePrepared;
}
/**
 * Properties for the PostNewQuestions React component
 */
export interface PostNewQuestionsProps {
    activeSessionData: ClientDataContract.QnaSession;
    onPostNewQuestion: Function;
}

const PostNewQuestions: React.FunctionComponent<PostNewQuestionsProps & ThemeProps> = (props) => {
    const colorScheme = props.theme.siteVariables.colorScheme;

    const [question, setQuestion] = useState('');

    const submitQuestion = () => {
        if (question) {
            props.onPostNewQuestion(question);
            setQuestion('');
        }
    };

    return (
        <div className="post-new-question">
            <Card aria-roledescription="card" style={{ backgroundColor: colorScheme.default.background, borderColor: colorScheme.onyx.border1 }} className="card-layout">
                <Card.Header fitted>
                    <Flex gap="gap.small">
                        <Flex column>
                            <Badge
                                styles={
                                    props.activeSessionData.isActive
                                        ? { backgroundColor: colorScheme.green.background, color: colorScheme.green.foreground1 }
                                        : { backgroundColor: colorScheme.default.background5, color: colorScheme.green.foreground4 }
                                }
                                text={props.activeSessionData.isActive ? 'Live' : 'Closed'}
                            />
                            <Text
                                className="date-content-format"
                                content={`Created on ${moment(props.activeSessionData.dateTimeCreated).format('L')} by ${props.activeSessionData.hostUser.name}`}
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
                        <Flex className="question-input-flex" gap="gap.small" vAlign="center">
                            <Avatar size="medium" name={props.activeSessionData.hostUser.name} />
                            <TextArea
                                className="question-input"
                                fluid
                                inverted
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
export default withTheme(PostNewQuestions);
