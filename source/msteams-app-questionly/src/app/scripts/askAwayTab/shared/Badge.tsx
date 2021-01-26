import './../index.scss';
import * as React from 'react';

/**
 * Properties for the Badge React component
 */
export interface BadgeProps {
    className: string;
    text: string;
}
const Badge: React.FunctionComponent<BadgeProps> = (props) => {
    return <span className={`badge ${props.className}`}>{`${props.text}`}</span>;
};
export default Badge;
