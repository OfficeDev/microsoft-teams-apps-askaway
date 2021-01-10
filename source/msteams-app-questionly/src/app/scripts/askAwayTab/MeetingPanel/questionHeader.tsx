// tslint:disable-next-line:no-relative-imports
import './../index.scss';
import * as React from 'react';
import {
    Flex,
    Text,
    FlexItem,
    Menu,
    menuAsToolbarBehavior,
    ShorthandCollection,
    MenuItemProps,
} from '@fluentui/react-northstar';
import {
    MoreIcon,
    LeaveIcon,
    RetryIcon,
} from '@fluentui/react-icons-northstar';
export interface QuestionHeaderProps {
    title: string;
    onClickRefreshSession: Function;
    onClickEndSession: Function;
}
const QuestionsHeader: React.FunctionComponent<QuestionHeaderProps> = (
    props
) => {
    const menu = {
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
    };

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
            menu: menu,
        },
    ];

    return (
        <Flex vAlign="start">
            <Text
                className="session-title"
                content={props.title}
                size="medium"
            />
            <FlexItem push>
                <div className="menuHeader">
                    <Menu
                        defaultActiveIndex={0}
                        items={menuItems}
                        iconOnly
                        accessibility={menuAsToolbarBehavior}
                        aria-label="Compose Editor"
                    />
                </div>
            </FlexItem>
        </Flex>
    );
};
export default QuestionsHeader;
