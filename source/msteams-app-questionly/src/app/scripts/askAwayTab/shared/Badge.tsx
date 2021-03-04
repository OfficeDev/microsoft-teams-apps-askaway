import { Properties } from 'csstype';
import * as React from 'react';
import './../index.scss';

/**
 * Properties for the Badge React component
 */
export interface BadgeProps {
    text: string;
    styles: Properties;
    className?: string;
}
const Badge: React.FunctionComponent<BadgeProps> = (props) => {
    return (
        <span style={props.styles} className={props.className ?? `badge`}>
            {props.text}
        </span>
    );
};
export default Badge;
