import './../index.scss';
import * as React from 'react';

/**
 * Properties for the Badge React component
 */
export interface BadgeProps {
    text: string;
    styles: object;
}
const Badge: React.FunctionComponent<BadgeProps> = (props) => {
    return <span style={props.styles} className={`badge`}>{`${props.text}`}</span>;
};
export default Badge;
