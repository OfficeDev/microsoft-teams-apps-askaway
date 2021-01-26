import * as React from 'react';
import { Flex, Text, Button, FlexItem, Card, Divider, Avatar, TextArea, ThemePrepared } from '@fluentui/react-northstar';
// import * as moment from "moment";
import Badge from '../shared/Badge';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';
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
}
const PostNewQuestions: React.FunctionComponent<PostNewQuestionsProps & ThemeProps> = (props) => {
    const colorScheme = props.theme.siteVariables.colorScheme;
    return (
        <div id="post-new-question">
            <Card aria-roledescription="card" style={{ backgroundColor: colorScheme.default.background }} className="card-layout">
                <Card.Header fitted>
                    <Flex gap="gap.small">
                        <Flex column>
                            <Badge className={props.activeSessionData.isActive ? 'badge--success' : 'badge--disabled'} text={props.activeSessionData.isActive ? 'Live' : 'Closed'} />
                            <Text
                                className="date-content-format"
                                content={`Created on ${moment(props.activeSessionData.dateTimeCreated).format('MM/DD/YYYY')} by ${props.activeSessionData.hostUser.name}`}
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
export default withTheme(PostNewQuestions);
