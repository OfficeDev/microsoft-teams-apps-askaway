// tslint:disable:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { Flex, Button, FlexItem, Divider } from '@fluentui/react-northstar';
import { SwitchIcon } from '../shared/Icons/SwitchIcon';
import { AddIcon, RetryIcon } from '@fluentui/react-icons-northstar';
import { ClientDataContract } from '../../../../../src/contracts/clientDataContract';
import { ParticipantRoles } from '../../../../enums/ParticipantRoles';
import { isPresenterOrOrganizer } from '.././shared/meetingUtility';

/**
 * Properties for the TabHeader React component
 */
export interface TabHeaderProps {
    refreshSession: Function;
    endSession: Function;
    t: Function;
    activeSessionData: ClientDataContract.QnaSession;
    showTaskModule: Function;
    /**
     * current user's role in meeting.
     */
    userRole: ParticipantRoles;
    /**
     * Indicator if buttons should be disabled. This will be required when parent componet is showing loading experience.
     */
    disableActions: boolean;
    /**
     * function that invokes switch session task module.
     */
    onSwitchSessionClick: Function;
}

const TabHeader: React.FunctionComponent<TabHeaderProps> = (props) => {
    const isUserPresenterOrOrganizer = isPresenterOrOrganizer(props.userRole);

    return (
        <React.Fragment>
            <Flex gap="gap.small" className="tab-nav-header">
                <Button
                    text
                    onClick={() => {
                        props.refreshSession();
                    }}
                    disabled={props.disableActions}
                >
                    <RetryIcon xSpacing="after" />
                    <Button.Content>{props.t('tab.refreshButton')}</Button.Content>
                </Button>
                {isUserPresenterOrOrganizer && (
                    <Button
                        text
                        disabled={props.disableActions || (props.activeSessionData && props.activeSessionData.isActive)}
                        onClick={() => {
                            props.showTaskModule();
                        }}
                    >
                        <AddIcon outline xSpacing="after" />
                        <Button.Content>{props.t('tab.startNewSession')}</Button.Content>
                    </Button>
                )}
                <Button
                    disabled={props.disableActions}
                    onClick={() => {
                        props.onSwitchSessionClick();
                    }}
                    text
                >
                    <SwitchIcon outline xSpacing="after" />
                    <Button.Content>{props.t('tab.switchSession')}</Button.Content>
                </Button>
                {isUserPresenterOrOrganizer && props.activeSessionData && props.activeSessionData.sessionId && (
                    <FlexItem push>
                        <Button
                            className="btn-end-session"
                            disabled={props.disableActions || (props.activeSessionData && !props.activeSessionData.isActive)}
                            primary
                            onClick={(e) => {
                                props.endSession(e);
                            }}
                            size="small"
                            content={props.t('tab.endSessionButton')}
                        />
                    </FlexItem>
                )}
            </Flex>
            <Divider />
        </React.Fragment>
    );
};

export default TabHeader;
