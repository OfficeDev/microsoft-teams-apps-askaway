import './../index.scss';
import * as React from 'react';
import { Image, Text, Flex } from '@fluentui/react-northstar';

const NoQuestionImage = require('./../../../web/assets/no-question.png');
/**
 * Properties for the NoQuestionDesign React component
 */
export interface NoQuestionDesignProps {
    t: Function;
    isSessionActive: boolean;
}
const NoQuestionDesign: React.FunctionComponent<NoQuestionDesignProps> = (props) => {
    const showSubText = (subText) => {
        return (
            <div className="text-center">
                <Text weight="bold" content={subText} />
            </div>
        );
    };

    return (
        <div>
            <div className="no-question-layout">
                <Flex column>
                    <Image src={NoQuestionImage} />
                </Flex>
            </div>
            {showSubText(!props.isSessionActive ? props.t('tab.whenSessionClosed') : props.t('tab.noQuestionsPosted'))}
        </div>
    );
};
export default NoQuestionDesign;
