import './../index.scss';
import * as React from 'react';
import { Flex, Text, Button, Image } from '@fluentui/react-northstar';

const createSessionImage = require('./../../../web/assets/collaboration.png');

/**
 * Properties for the TabCreateSession React component
 */
export interface TabCreateSessionProps {
    showTaskModule: Function;
}
const TabCreateSession: React.FunctionComponent<TabCreateSessionProps> = (props) => {
    return (
        <Flex hAlign="center" vAlign="center" className="screen">
            <Image className="create-session" alt="image" src={createSessionImage} />
            <Flex.Item align="center">
                <Text className="text-caption" content="Welcome to Ask Away!" />
            </Flex.Item>
            <Flex.Item align="center">
                <Text className="text-subcaption" content="Create, manage, and participate in Q&A sessions." />
            </Flex.Item>
            <Flex.Item align="center">
                <Button
                    primary
                    className="button"
                    onClick={() => {
                        props.showTaskModule();
                    }}
                >
                    <Button.Content>Start a Q&A session</Button.Content>
                </Button>
            </Flex.Item>
        </Flex>
    );
};
export default TabCreateSession;
