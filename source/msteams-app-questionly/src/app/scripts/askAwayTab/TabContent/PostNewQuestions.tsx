import './../index.scss';
import * as React from 'react';
import { Flex, Text, Button, FlexItem, Card, Divider, Avatar, TextArea } from '@fluentui/react-northstar';
import Badge from '../shared/Badge';
import { useState } from 'react';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';
import { ThemeProps, withTheme } from '../shared/WithTheme';
import Helper from '../shared/Helper';

/**
 * Properties for the PostNewQuestions React component
 */
export interface PostNewQuestionsProps {
    activeSessionData: ClientDataContract.QnaSession;
    userName: string;
    t: Function;
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
                                className="badge"
                                styles={
                                    props.activeSessionData.isActive
                                        ? { backgroundColor: colorScheme.green.background, color: colorScheme.green.foreground1 }
                                        : { backgroundColor: colorScheme.default.background5, color: colorScheme.default.foregroundFocus1 }
                                }
                                text={props.activeSessionData.isActive ? props.t('tab.liveStatus') : props.t('tab.closedStatus')}
                            />
                            <Text
                                className="date-content-format"
                                content={props.t('tab.createdBy', {
                                    date: Helper.createDateString(props.activeSessionData.dateTimeCreated),
                                    name: props.activeSessionData.hostUser.name,
                                })}
                                size="small"
                            />
                        </Flex>
                    </Flex>
                </Card.Header>
                <Card.Body>
                    <Flex column gap="gap.small">
                        <Text className="session-title" size="large" weight="bold" content={props.activeSessionData.title} />
                    </Flex>
                </Card.Body>
                {props.activeSessionData.isActive && (
                    <Card.Footer>
                        <Divider />
                        <Flex className="question-input-flex" gap="gap.small" vAlign="center">
                            <Avatar size="medium" name={props.userName} />
                            <TextArea
                                className="question-input"
                                fluid
                                inverted
                                maxLength={250}
                                placeholder={props.t('tab.questionPlaceholder')}
                                onChange={(e) => {
                                    setQuestion(e.target['value']);
                                }}
                                value={question}
                            />
                            <FlexItem push>
                                <Button onClick={() => submitQuestion()} size="medium">
                                    <Button.Content>{props.t('tab.postQuestionButton')}</Button.Content>
                                </Button>
                            </FlexItem>
                        </Flex>
                    </Card.Footer>
                )}
                {!props.activeSessionData.isActive && (
                    <Card.Footer styles={{ marginBottom: '0' }}>
                        <Text content={props.activeSessionData.description} />
                    </Card.Footer>
                )}
            </Card>
        </div>
    );
};
export default withTheme(PostNewQuestions);
