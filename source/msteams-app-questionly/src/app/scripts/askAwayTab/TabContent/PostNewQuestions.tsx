import './../index.scss';
import * as React from 'react';
import { Flex, Text, Button, Image, FlexItem, Card, Divider, Avatar, TextArea } from '@fluentui/react-northstar';
import Badge from '../TabContent/Badge';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';

const icon = require('./../../../web/assets/icon.png');

/**
 * Properties for the PostNewQuestions React component
 */
export interface PostNewQuestionsProps {
    activeSessionData: ClientDataContract.QnaSession;
}
const PostNewQuestions: React.FunctionComponent<PostNewQuestionsProps> = (props) => {
    const formatDate = (dateTimeCreated) => {
        if (dateTimeCreated) {
            const date = new Date(dateTimeCreated);
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        } else {
            return ' ';
        }
    };

    return (
        <div id="post-new-question">
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
                <Card.Footer>
                    <Divider />
                    <Flex styles={{ paddingTop: '0.3rem', marginBottom: '-1rem' }} gap="gap.small" vAlign="center">
                        <Avatar size="medium" name={props.activeSessionData.hostUser.name} />
                        <TextArea styles={{ paddingBottom: '0rem' }} fluid placeholder="Type a question here" />
                        <FlexItem push>
                            <Button size="medium">
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
