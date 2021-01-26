import './../index.scss';
import * as React from 'react';
import { Flex, Text, Button, Image } from '@fluentui/react-northstar';

const createSessionImage = require('./../../../web/assets/create_session.png');

/**
 * Properties for the TabCreateSession React component
 */
export interface TabCreateSessionProps {
    showTaskModule: Function;
    t: Function;
}
const TabCreateSession: React.FunctionComponent<TabCreateSessionProps> = (props) => {
    return (
        <Flex hAlign="center" vAlign="center" className="screen">
            <Image className="create-session" alt="image" src={createSessionImage} />
            <Flex.Item align="center">
                <Text className="text-caption" content={props.t('Tab.WelcomeText')} />
            </Flex.Item>
            <Flex.Item align="center">
                <Text className="text-subcaption" content={props.t('Tab.WelcomeSubText')} />
            </Flex.Item>
            <Flex.Item align="center">
                <Button
                    primary
                    className="button"
                    onClick={() => {
                        props.showTaskModule();
                    }}
                >
                    <Button.Content>{props.t('Tab.CreateButton')}</Button.Content>
                </Button>
            </Flex.Item>
        </Flex>
    );
};
export default TabCreateSession;
