// tslint:disable:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { Flex, Text, FlexItem, Menu, menuAsToolbarBehavior, ShorthandCollection, MenuItemProps } from '@fluentui/react-northstar';
import { MoreIcon, LeaveIcon, RetryIcon } from '@fluentui/react-icons-northstar';
import { ParticipantRoles } from '../../../../enums/ParticipantRoles';
import { isPresenterOrOrganizer } from '../shared/meetingUtility';

/**
 * Properties for the QnASessionHeader React component
 */
export interface QnASessionHeaderProps {
    title: string;
    onClickRefreshSession: Function;
    onClickEndSession: Function;
    showToolBar: boolean;
    t: Function;
    userRole: ParticipantRoles;
}
const QnASessionHeader: React.FunctionComponent<QnASessionHeaderProps> = (props) => {
    const items = [
        {
            key: 'Refresh session',
            content: props.t('meetingPanel.refreshSessionButton'),
            onClick: () => {
                props.onClickRefreshSession();
            },
            icon: <RetryIcon outline />,
        },
    ];

    // End session option is only available to meeting organizers and presenters.
    if (isPresenterOrOrganizer(props.userRole)) {
        items.push({
            key: 'End session',
            content: props.t('meetingPanel.endSessionButton'),
            onClick: () => {
                props.onClickEndSession();
            },
            icon: <LeaveIcon outline />,
        });
    }

    const menuItems: ShorthandCollection<MenuItemProps> = [
        {
            icon: (
                <MoreIcon
                    {...{
                        outline: false,
                    }}
                />
            ),
            key: 'moreOptions',
            'aria-label': 'More options',
            indicator: false,
            menu: { items: items },
        },
    ];

    return (
        <Flex gap="gap.large" vAlign="center">
            <Text className="session-title" content={props.title} size="medium" />
            {props.showToolBar && (
                <FlexItem push>
                    <div className="menuHeader">
                        <Menu defaultActiveIndex={0} items={menuItems} iconOnly accessibility={menuAsToolbarBehavior} aria-label="Compose Editor" />
                    </div>
                </FlexItem>
            )}
        </Flex>
    );
};
export default QnASessionHeader;
