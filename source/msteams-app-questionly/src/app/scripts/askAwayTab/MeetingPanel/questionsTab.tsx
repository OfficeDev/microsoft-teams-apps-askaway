// tslint:disable-next-line:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { Menu, tabListBehavior } from '@fluentui/react-northstar';
export interface QuestionsTabProps {
    constValue: any;
    onSelectActiveTab: Function;
}
const QuestionsTab: React.FunctionComponent<QuestionsTabProps> = (props) => {
    const items = [
        {
            key: props.constValue.TAB_QUESTIONS.UNANSWERED_Q,
            content: 'Pending questions',
            onClick: () => {
                props.onSelectActiveTab(
                    props.constValue.TAB_QUESTIONS.UNANSWERED_Q
                );
            },
        },
        {
            key: props.constValue.TAB_QUESTIONS.ANSWERED_Q,
            content: 'Answered questions',
            onClick: () => {
                props.onSelectActiveTab(
                    props.constValue.TAB_QUESTIONS.ANSWERED_Q
                );
            },
        },
    ];

    return (
        <React.Fragment>
            <Menu
                defaultActiveIndex={0}
                items={items}
                primary
                underlined
                accessibility={tabListBehavior}
                aria-label="Today's events"
                className="menu-bar"
            />
        </React.Fragment>
    );
};
export default QuestionsTab;
