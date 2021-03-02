import { Menu, tabListBehavior } from '@fluentui/react-northstar';
import { TFunction } from 'i18next';
import * as React from 'react';
import './../index.scss';
import { CONST } from './../shared/Constants';

/**
 * Properties for the TabHeader React component
 */
export interface TabHeaderProps {
    onSelectActiveTab: Function;
    tabActiveIndex: number;
    t: TFunction;
}
const TabHeader: React.FunctionComponent<TabHeaderProps> = (props) => {
    const items = [
        {
            key: CONST.TAB_QUESTIONS.UNANSWERED_Q,
            content: props.t('meetingPanel.showPendingQuestions'),
            onClick: () => {
                props.onSelectActiveTab(CONST.TAB_QUESTIONS.UNANSWERED_Q);
            },
        },
        {
            key: CONST.TAB_QUESTIONS.ANSWERED_Q,
            content: props.t('meetingPanel.showAnsweredQuestions'),
            onClick: () => {
                props.onSelectActiveTab(CONST.TAB_QUESTIONS.ANSWERED_Q);
            },
        },
    ];

    return (
        <React.Fragment>
            <Menu defaultActiveIndex={props.tabActiveIndex} items={items} primary underlined accessibility={tabListBehavior} aria-label="Today's events" className="menu-bar" />
        </React.Fragment>
    );
};
export default TabHeader;
