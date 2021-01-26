import './../index.scss';
import * as React from 'react';
import { Flex, Text, Button, Image, FlexItem, Card, Divider, Avatar, TextArea } from '@fluentui/react-northstar';
import Badge from '../shared/Badge';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';
import { Helper } from '../shared/Helper';

/**
 * Properties for the PostNewQuestions React component
 */
export interface PostNewQuestionsProps {
    activeSessionData: ClientDataContract.QnaSession;
}
const PostNewQuestions: React.FunctionComponent<PostNewQuestionsProps> = (props) => {
    return (
        <div id="post-new-question">
            <Card aria-roledescription="card" elevated className="card-layout">
                <Card.Header fitted>
                    <Flex gap="gap.small">
                        <Flex column>
                            <Badge className={props.activeSessionData.isActive ? 'badge--success' : 'badge--disabled'} text={props.activeSessionData.isActive ? 'Live' : 'Closed'} />
                            <Text
                                className="date-content-format"
                                content={`Created on ${Helper.formatDateMMDDYYYY(props.activeSessionData.dateTimeCreated)} by ${props.activeSessionData.hostUser.name}`}
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
                <Card.Footer>
                    <Divider />
                    <Flex gap="gap.small" vAlign="center">
                        <Avatar size="medium" name={props.activeSessionData.hostUser.name} />
                        <TextArea fluid placeholder="Type a question here" />
                        <FlexItem push>
                            <Button type="submit" size="medium">
                                <Button.Content>Post</Button.Content>
                            </Button>
                        </FlexItem>
                    </Flex>
                </Card.Footer>
            </Card>
        </div>
    );
};
export default PostNewQuestions;
