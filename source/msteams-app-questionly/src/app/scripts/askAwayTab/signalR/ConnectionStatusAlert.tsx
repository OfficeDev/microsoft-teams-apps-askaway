// tslint:disable:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { useState } from 'react';
import { Flex, Button, Text, FlexItem, CloseIcon } from '@fluentui/react-northstar';
import { ThemeProps, withTheme } from '../shared/WithTheme';
import { TFunction } from 'i18next';
import { Trans } from 'react-i18next';

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

    /**
     *  __FOR_UTs_ONLY_ flag disabling trans 'react-i18next' component.
     */
    __disableTransComponent?: boolean;
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
                                {!props.__disableTransComponent && (
                                    <Trans t={props.t} i18nKey="meetingPanel.bannerText" components={[<a className="refreshNowLink" href="" onClick={(e) => refreshConnection(e)}></a>]}></Trans>
                                )}
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
