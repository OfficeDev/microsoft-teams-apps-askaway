// tslint:disable:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { useState } from 'react';
import { Flex, Button, Text, FlexItem, CloseIcon, ThemePrepared } from '@fluentui/react-northstar';
import { withTheme } from '../shared/WithTheme';
import { TFunction } from 'i18next';

/**
 * Properties of ConnectionStatusAlert component.
 */
export interface ConnectionStatusAlertProps {
    /**
     * Callback when `Refresh now` link is clicked.
     */
    onRefreshConnection: Function;

    /**
     * TFunction to localize strings.
     */
    t: TFunction;
}

/**
 * Theme properties taken from context.
 */
interface ThemeProps {
    theme: ThemePrepared;
}

/**
 * Alert component, displays connection error when required and provides refresh action.
 */
export const ConnectionStatusAlert: React.FunctionComponent<ConnectionStatusAlertProps & ThemeProps> = (props) => {
    // State variable to handle alert dismiss action.
    const [dismissed, setDismissed] = useState(false);
    const colorScheme = props.theme.siteVariables.colorScheme;

    const refreshConnection = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        props.onRefreshConnection();
        // `preventDefault` prevents anchor tag from opening the href url.
        e.preventDefault();
    };

    const refreshLink = (
        <a className="refreshNowLink" href="" onClick={(e) => refreshConnection(e)}>
            {props.t('meetingPanel.refreshLinkText')}
        </a>
    );

    return (
        <div>
            {!dismissed && (
                <div
                    id="Alert"
                    style={{ backgroundColor: colorScheme.default.background3, color: colorScheme.default.foreground1, borderColor: colorScheme.default.border2 }}
                    className="connectionStatusAlert"
                >
                    <Flex vAlign="center">
                        <FlexItem>
                            <Text className="alertContent" weight="semibold">
                                Connection lost.{' '}
                                <a className="refreshNowLink" href="" onClick={(e) => refreshConnection(e)}>
                                    Refresh
                                </a>{' '}
                                to view content. If that doesn’t do the trick, try again later.
                            </Text>
                        </FlexItem>
                        <FlexItem push>
                            <Button
                                size="smallest"
                                icon={
                                    <CloseIcon
                                        onClick={() => {
                                            setDismissed(true);
                                        }}
                                    />
                                }
                                text
                                iconOnly
                            />
                        </FlexItem>
                    </Flex>
                </div>
            )}
        </div>
    );
};
export default withTheme(ConnectionStatusAlert);
