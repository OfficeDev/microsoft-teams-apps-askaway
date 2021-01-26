import './../index.scss';
import * as React from 'react';
import { Flex, Text, Button, FlexItem, Card, Divider, Avatar, TextArea } from '@fluentui/react-northstar';
import Badge from '../shared/Badge';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';
import Helper from '../shared/Helper';

/**
 * Properties for the PostNewQuestions React component
 */
export interface PostNewQuestionsProps {
    activeSessionData: ClientDataContract.QnaSession;
    t: Function;
}
const PostNewQuestions: React.FunctionComponent<PostNewQuestionsProps> = (props) => {
    return (
        <div id="post-new-question">
            <Card aria-roledescription="card" elevated className="card-layout">
                <Card.Header fitted>
                    <Flex gap="gap.small">
                        <Flex column>
                            <Badge
                                className={props.activeSessionData.isActive ? 'badge--success' : 'badge--disabled'}
                                text={props.activeSessionData.isActive ? props.t('Tab.LiveStatus') : props.t('Tab.ClosedStatus')}
                            />
                            <Text
                                className="date-content-format"
                                content={`${props.t('Tab.Created')} ${Helper.formatDateMMDDYYYY(props.activeSessionData.dateTimeCreated)} ${props.t('Tab.By')} ${
                                    props.activeSessionData.hostUser.name
                                }`}
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
                        <TextArea fluid placeholder={props.t('Tab.Placeholder')} />
                        <FlexItem push>
                            <Button type="submit" size="medium">
                                <Button.Content>{props.t('Tab.PostButton')}</Button.Content>
                            </Button>
                        </FlexItem>
                    </Flex>
                </Card.Footer>
            </Card>
        </div>
    );
};
export default PostNewQuestions;
