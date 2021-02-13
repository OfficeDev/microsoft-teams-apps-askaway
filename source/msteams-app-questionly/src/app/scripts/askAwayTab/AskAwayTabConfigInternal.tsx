import './index.scss';
import * as React from 'react';
import { Flex, Text, Image } from '@fluentui/react-northstar';
import { useTranslation } from 'react-i18next';

/**
 * Properties for the Badge React component
 */
export interface AskAwayTabConfigInternalProps {}
const AskAwayTabConfigInternal: React.FunctionComponent<AskAwayTabConfigInternalProps> = (props) => {
    const { t } = useTranslation();

    return (
        <div className="tab-config-container">
            <Flex hAlign="center" vAlign="center">
                <Image alt="image" src={require('./../../web/assets/askaway_tab_added.png')} />
                <Flex.Item align="center">
                    <Text className="text-configtab-caption" content={t('tab.configTabText')} />
                </Flex.Item>
            </Flex>
        </div>
    );
};
export default AskAwayTabConfigInternal;
