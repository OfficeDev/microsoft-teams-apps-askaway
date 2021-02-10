import * as React from 'react';
import { Provider, ThemePrepared } from '@fluentui/react-northstar';

interface ThemeProps {
    theme: ThemePrepared;
}

/** Creates dummy color schemes for unit tests */
const createThemeForUTs = () => {
    return {
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
    };
};

/**
 * Higher-order component that takes theme from context and passes it to the wrapped component
 */
export function withTheme<TProps>(base: React.FunctionComponent<TProps & ThemeProps>): React.FunctionComponent<TProps> {
    return (props: TProps) => (
        <Provider.Consumer
            render={(theme: any) => {
                if (!theme && process.env.debugMode === 'true') {
                    theme = createThemeForUTs();
                }
                return base({ ...props, theme });
            }}
        />
    );
}
