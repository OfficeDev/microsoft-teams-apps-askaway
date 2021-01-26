import './../index.scss';
import * as React from 'react';
import { Flex, Button, FlexItem } from '@fluentui/react-northstar';
import { SwitchIcon } from '../shared/Icons/SwitchIcon';
import { AddIcon, RetryIcon } from '@fluentui/react-icons-northstar';

/**
 * Properties for the TabHeader React component
 */
export interface TabHeaderProps {
    refreshSession: Function;
    endSession: Function;
    t: Function;
}
const TabHeader: React.FunctionComponent<TabHeaderProps> = (props) => {
    return (
        <React.Fragment>
            <Flex gap="gap.large">
                <Button
                    text
                    onClick={() => {
                        props.refreshSession();
                    }}
                >
                    <RetryIcon xSpacing="after" />
                    <Button.Content>{props.t('Tab.Refresh')}</Button.Content>
                </Button>
                <Button text>
                    <AddIcon outline xSpacing="after" />
                    <Button.Content>{props.t('Tab.StartSession')}</Button.Content>
                </Button>
                <Button text>
                    <SwitchIcon outline xSpacing="after" />
                    <Button.Content>{props.t('Tab.SwitchSession')}</Button.Content>
                </Button>
                <FlexItem push>
                    <Button
                        primary
                        onClick={(e) => {
                            props.endSession(e);
                        }}
                        size="small"
                        content={props.t('Tab.EndButton')}
                    />
                </FlexItem>
            </Flex>
        </React.Fragment>
    );
};
export default TabHeader;
