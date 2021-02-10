import { Flex, Button, Text, List } from '@fluentui/react-northstar';
import * as React from 'react';
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import SessionListCard from './SessionListCard';
import * as microsoftTeams from '@microsoft/teams-js';
import './../../index.scss';
import { useState } from 'react';
import { TFunction } from 'i18next';

export interface SessionListProps {
    /**
     * Q&A session list.
     */
    qnaSessions: ClientDataContract.QnaSession[];
    /**
     * Index of the currently selected session.
     */
    selectedSessionIndex: number;
    /**
     * TFunction to localize strings.
     */
    t: TFunction;
}

/**
 * Session list to switch between sessions.
 */
const SessionList: React.FunctionComponent<SessionListProps> = (props) => {
    const [selectedSessionIndex, setSelectedSessionIndex] = useState(props.selectedSessionIndex);
    const qnaSessions = props.qnaSessions;

    /**
     * Callback for `switch now` button click.
     */
    const onSubmit = () => {
        if (selectedSessionIndex >= 0) {
            microsoftTeams.tasks.submitTask(qnaSessions[selectedSessionIndex]);
        } else {
            // Close task module if no session selected.
            microsoftTeams.tasks.submitTask();
        }
    };

    /**
     * Callback for `cancel` button click.
     */
    const onCancel = () => {
        // Close task module.
        microsoftTeams.tasks.submitTask();
    };

    if (qnaSessions.length) {
        return (
            <React.Fragment>
                <div className="switchSessionListHolder">
                    <Flex className="title" gap="gap.small">
                        <Text content={props.t('popups.selectSession')} weight="regular" size="medium" align="start"></Text>
                    </Flex>
                    <List
                        className="switchSessionList"
                        selectable
                        onSelectedIndexChange={(e, newProps) => {
                            setSelectedSessionIndex(newProps?.selectedIndex ?? -1);
                        }}
                        selectedIndex={selectedSessionIndex}
                        items={qnaSessions?.map((qnaSession) => {
                            return <SessionListCard t={props.t} qnaSession={qnaSession}></SessionListCard>;
                        })}
                    ></List>
                </div>
                <Flex gap="gap.small" className="switchButton">
                    <Button secondary type="submit" onClick={onCancel} size="medium">
                        <Button.Content>{props.t('popups.cancel')}</Button.Content>
                    </Button>
                    <Button primary type="submit" onClick={onSubmit} size="medium">
                        <Button.Content>{props.t('popups.switchNow')}</Button.Content>
                    </Button>
                </Flex>
            </React.Fragment>
        );
    } else {
        return <div className="centerContent">{props.t('popups.noSessionsToSelect')}</div>;
    }
};

export default SessionList;
