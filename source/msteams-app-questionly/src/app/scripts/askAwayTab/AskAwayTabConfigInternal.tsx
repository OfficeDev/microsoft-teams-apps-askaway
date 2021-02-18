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
        <Flex column className="tab-config-container" gap="gap.large" hAlign="center" vAlign="center">
            <Image alt="image" src={require('./../../web/assets/askaway_tab_added.png')} />
            <Flex.Item align="center">
                <Text size="large" weight="bold" content={t('tab.configTabText')} />
            </Flex.Item>
        </Flex>
    );
};
export default AskAwayTabConfigInternal;
