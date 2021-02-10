import './index.scss';
import * as React from 'react';
import { Flex, Text, Header } from '@fluentui/react-northstar';
import { useTranslation } from 'react-i18next';

/**
 * Properties for the Badge React component
 */
export interface AskAwayTabRemoveInternalProps {}
const AskAwayTabRemoveInternal: React.FunctionComponent<AskAwayTabRemoveInternalProps> = (props) => {
    const { t } = useTranslation();

    return (
        <Flex fill={true}>
            <Flex.Item>
                <div>
                    <Header content={t('tab.removeHeaderText')} />
                    <Text content={t('tab.removeTextNotification')} />
                </div>
            </Flex.Item>
        </Flex>
    );
};
export default AskAwayTabRemoveInternal;
