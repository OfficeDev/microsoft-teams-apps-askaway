import './../index.scss';
import * as React from 'react';
import { Flex, Button, FlexItem, Divider } from '@fluentui/react-northstar';
import { SwitchIcon } from '../shared/Icons/SwitchIcon';
import { AddIcon, RetryIcon } from '@fluentui/react-icons-northstar';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';

/**
 * Properties for the TabHeader React component
 */
export interface TabHeaderProps {
    refreshSession: Function;
    endSession: Function;
    activeSessionData: ClientDataContract.QnaSession;
    showTaskModule: Function;
}
const TabHeader: React.FunctionComponent<TabHeaderProps> = (props) => {
    return (
        <React.Fragment>
            <Flex gap="gap.small" className="tab-nav-header">
                <Button
                    text
                    onClick={() => {
                        props.refreshSession();
                    }}
                >
                    <RetryIcon xSpacing="after" />
                    <Button.Content>Refresh</Button.Content>
                </Button>
                <Button
                    text
                    disabled={props.activeSessionData && props.activeSessionData.isActive}
                    onClick={() => {
                        props.showTaskModule();
                    }}
                >
                    <AddIcon outline xSpacing="after" />
                    <Button.Content>Start a Q&A session</Button.Content>
                </Button>
                <Button text>
                    <SwitchIcon outline xSpacing="after" />
                    <Button.Content>Switch to another session</Button.Content>
                </Button>
                {props.activeSessionData && props.activeSessionData.sessionId && (
                    <FlexItem push>
                        <Button
                            disabled={props.activeSessionData && !props.activeSessionData.isActive}
                            primary
                            onClick={(e) => {
                                props.endSession(e);
                            }}
                            size="medium"
                            content="End session"
                        />
                    </FlexItem>
                )}
            </Flex>
            <Divider />
        </React.Fragment>
    );
};
export default TabHeader;
