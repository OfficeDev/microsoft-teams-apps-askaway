import { Button, Flex, Image, Text } from '@fluentui/react-northstar';
import * as React from 'react';
import { ParticipantRoles } from '../../../../enums/ParticipantRoles';
import { isPresenterOrOrganizer } from '.././shared/meetingUtility';
import './../index.scss';

const createSessionImage = require('./../../../web/assets/collaboration.png');
const noSessionImageForAttendees = require('./../../../web/assets/relax_and_wait.png');

/**
 * Properties for the TabCreateSession React component
 */
export interface TabCreateSessionProps {
    showTaskModule: Function;
    t: Function;
    /**
     * current user's role in meeting.
     */
    userRole: ParticipantRoles;
}
const TabCreateSession: React.FunctionComponent<TabCreateSessionProps> = (props) => {
    const isUserPresenterOrOrganizer = isPresenterOrOrganizer(props.userRole);
    const imageSrc = isUserPresenterOrOrganizer ? createSessionImage : noSessionImageForAttendees;
    const subText = isUserPresenterOrOrganizer ? props.t('tab.welcomeSubTextPresenter') : props.t('tab.welcomeSubTextAttendee');

    return (
        <Flex column hAlign="center" vAlign="center" className="screen" gap="gap.medium">
            <Image alt="image" src={imageSrc} />
            <Text size="large" weight="bold" className="text-caption" content={props.t('tab.welcomeText')} />
            <Text size="medium" content={subText} />
            {isUserPresenterOrOrganizer && (
                <Button
                    primary
                    className="button"
                    content={props.t('tab.createButton')}
                    onClick={() => {
                        props.showTaskModule();
                    }}
                />
            )}
        </Flex>
    );
};
export default TabCreateSession;
