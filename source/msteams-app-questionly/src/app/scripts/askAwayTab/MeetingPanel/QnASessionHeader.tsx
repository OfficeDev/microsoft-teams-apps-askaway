// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LeaveIcon, MoreIcon, RetryIcon } from '@fluentui/react-icons-northstar';
import { TFunction } from 'i18next';
import { Flex, FlexItem, Menu, menuAsToolbarBehavior, MenuItemProps, ShorthandCollection, Text } from '@fluentui/react-northstar';
import * as React from 'react';
import { ParticipantRoles } from '../../../../enums/ParticipantRoles';
import { isPresenterOrOrganizer } from '../shared/meetingUtility';
import { ThemeProps, withTheme } from '../shared/WithTheme';
import './../index.scss';

/**
 * Properties for the QnASessionHeader React component
 */
export interface QnASessionHeaderProps {
    title: string;
    onClickRefreshSession: Function;
    onClickEndSession: Function;
    showToolBar: boolean;
    t: TFunction;
    userRole: ParticipantRoles;
}

export const QnASessionHeader: React.FunctionComponent<QnASessionHeaderProps & ThemeProps> = (props) => {
    const colorScheme = props.theme.siteVariables.colorScheme;

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
                    styles={{ color: colorScheme.default.foregroundHover }}
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
        <Flex className="qna-header" gap="gap.large">
            <Text title={props.title} className="truncated-title" content={props.title} size="large" />
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
export default withTheme(QnASessionHeader);
