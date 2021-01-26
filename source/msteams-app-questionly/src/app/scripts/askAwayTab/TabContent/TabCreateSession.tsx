import './../index.scss';
import * as React from 'react';
import { Flex, Text, Button, Image } from '@fluentui/react-northstar';

const createSessionImage = require('./../../../web/assets/create_session.png');

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
                <Text className="text-caption" content="Welcome to Ask Away! We’re glad you’re here." />
            </Flex.Item>
            <Flex.Item align="center">
                <Text className="text-subcaption" content="Ask away is your tool to create and manage Q&A sessions." />
            </Flex.Item>
            <Flex.Item align="center">
                <Button
                    primary
                    className="button"
                    onClick={() => {
                        props.showTaskModule();
                    }}
                >
                    <Button.Content>Create an ask away</Button.Content>
                </Button>
            </Flex.Item>
        </Flex>
    );
};
export default TabCreateSession;
