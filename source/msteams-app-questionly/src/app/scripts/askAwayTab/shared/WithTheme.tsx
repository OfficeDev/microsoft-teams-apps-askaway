import * as React from 'react';
import { Provider, ThemePrepared } from '@fluentui/react-northstar';

export interface ThemeProps {
    theme: ThemePrepared;
}

// Creates dummy color schemes for unit tests
const createThemeForUTs = (): ThemePrepared => {
    return ({
        siteVariables: {
            colorScheme: {
                default: {
                    foregroundDisabled1: '',
                    border: '',
                },
                green: {
                    background: '',
                    foreground1: '',
                },
            },
        },
    } as unknown) as ThemePrepared;
};

/**
 * Higher-order component that takes theme from context and passes it to the wrapped component
 */
export function withTheme<TProps>(base: React.FunctionComponent<TProps & ThemeProps>): React.FunctionComponent<TProps> {
    return (props: TProps) => (
        <Provider.Consumer
            render={(theme: any) => {
                if (!theme?.siteVariables?.colorScheme) {
                    theme = createThemeForUTs();
                }
                return base({ ...props, theme });
            }}
        />
    );
}
