import * as React from 'react';
import { Flex, Text, Button, FlexItem, Card, Divider, Avatar, TextArea, ThemePrepared } from '@fluentui/react-northstar';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';
import Helper from '../shared/Helper';
import Badge from '../shared/Badge';
import { withTheme } from '../shared/WithTheme';
import './../index.scss';

let moment = require('moment');
/**
 * Theme properties taken from context
 */
interface ThemeProps {
    theme: ThemePrepared;
}
/**
 * Properties for the PostNewQuestions React component
 */
export interface PostNewQuestionsProps {
    activeSessionData: ClientDataContract.QnaSession;
    t: Function;
}
const PostNewQuestions: React.FunctionComponent<PostNewQuestionsProps & ThemeProps> = (props) => {
    const colorScheme = props.theme.siteVariables.colorScheme;
    return (
        <div id="post-new-question">
            <Card aria-roledescription="card" style={{ backgroundColor: colorScheme.default.background }} className="card-layout">
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
                                content={`${props.t('tab.createdOn')} ${moment(props.activeSessionData.dateTimeCreated).format('L')} ${props.t('tab.by')} ${props.activeSessionData.hostUser.name}`}
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
                        <TextArea styles={{ paddingBottom: '0rem', height: '2.3rem' }} fluid placeholder={props.t('tab.questionPlaceholder')} />
                        <FlexItem push>
                            <Button size="medium">
                                <Button.Content>{props.t('tab.postQuestionButton')}</Button.Content>
                            </Button>
                        </FlexItem>
                    </Flex>
                </Card.Footer>
            </Card>
        </div>
    );
};
export default withTheme(PostNewQuestions);
