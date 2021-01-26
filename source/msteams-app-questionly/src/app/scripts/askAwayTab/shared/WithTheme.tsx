import * as React from 'react';
import { Provider, ThemePrepared } from '@fluentui/react-northstar';

interface ThemeProps {
    theme: ThemePrepared;
}
/**
 * Higher-order component that takes theme from context and passes it to the wrapped component
 */
export function withTheme<TProps>(base: React.FunctionComponent<TProps & ThemeProps>): React.FunctionComponent<TProps> {
    return (props: TProps) => <Provider.Consumer render={(theme) => base({ ...props, theme })} />;
}
