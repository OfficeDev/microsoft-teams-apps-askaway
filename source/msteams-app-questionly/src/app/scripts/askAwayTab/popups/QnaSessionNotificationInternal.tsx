import './../index.scss';
import * as React from 'react';
import { Flex, Text, Button } from '@fluentui/react-northstar';
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
        <Flex column>
            <Text content={t('popups.notificationTitle', { userName: userName })} />
            <div className="notification-title">
                <Text content={sessionTitle} weight="bold" />
            </div>
            <Flex gap="gap.large" vAlign="center">
                <Text content={t('popups.notificationMessage')} />
                <Button
                    primary
                    type="submit"
                    size="small"
                    onClick={() => {
                        props.onSubmitSession();
                    }}
                >
                    <Button.Content>{t('popups.notificationButton')}</Button.Content>
                </Button>
            </Flex>
        </Flex>
    );
};
export default QnaSessionNotificationInternal;
