// tslint:disable:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { Flex, Text, FlexItem, Menu, menuAsToolbarBehavior, ShorthandCollection, MenuItemProps } from '@fluentui/react-northstar';
import { MoreIcon, LeaveIcon, RetryIcon } from '@fluentui/react-icons-northstar';

/**
 * Properties for the QnASessionHeader React component
 */
export interface QnASessionHeaderProps {
    title: string;
    onClickRefreshSession: Function;
    onClickEndSession: Function;
    showToolBar: boolean;
}
const QnASessionHeader: React.FunctionComponent<QnASessionHeaderProps> = (props) => {
    const menuItems: ShorthandCollection<MenuItemProps> = [
        {
            icon: (
                <MoreIcon
                    {...{
                        outline: false,
                    }}
                />
            ),
            key: 'menuButton2',
            'aria-label': 'More options',
            indicator: false,
            menu: {
                items: [
                    {
                        key: 'Refresh session',
                        content: 'Refresh session',
                        onClick: () => {
                            props.onClickRefreshSession();
                        },
                        icon: <RetryIcon outline />,
                    },
                    {
                        key: 'End session',
                        content: 'End session',
                        onClick: () => {
                            props.onClickEndSession();
                        },
                        icon: <LeaveIcon outline />,
                    },
                ],
            },
        },
    ];

    return (
        <Flex vAlign="start">
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
