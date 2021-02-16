import './../index.scss';
import * as React from 'react';
import { Flex, Text, Button, FlexItem } from '@fluentui/react-northstar';
import { useTranslation } from 'react-i18next';

/**
 * Properties for the CreateSessionInternal React component
 */
export interface QnaSessionNotificationInternalProps {
    searchParams: URLSearchParams;
    onSubmitSession: Function;
}
const QnaSessionNotificationInternal: React.FunctionComponent<QnaSessionNotificationInternalProps> = (props) => {
    const { t } = useTranslation();

    const sessionTitle = props.searchParams.get('title');

    const userName = props.searchParams.get('username');

    return (
        <Flex className="notification-popup" column>
            <Text content={t('popups.notificationTitle', { userName: userName })} />
            <div className="notification-title">
                <Text content={sessionTitle} weight="bold" />
            </div>
            <Flex gap="gap.large" vAlign="center">
                <Text content={t('popups.notificationMessage')} />
            </Flex>
            <FlexItem push>
                <Button
                    primary
                    type="submit"
                    size="small"
                    content={t('popups.notificationButton')}
                    onClick={() => {
                        props.onSubmitSession();
                    }}
                ></Button>
            </FlexItem>
        </Flex>
    );
};
export default QnaSessionNotificationInternal;
