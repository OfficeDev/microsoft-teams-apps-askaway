import * as React from 'react';
import cx from 'classnames';
import { createSvgIcon } from '@fluentui/react-icons-northstar/dist/dts/src/utils/createSvgIcon';
import { iconClassNames } from '@fluentui/react-icons-northstar/dist/dts/src/utils/iconClassNames';

export const SwitchIcon = createSvgIcon({
    svg: ({ classes }) => (
        <svg
            role="presentation"
            focusable="false"
            viewBox="0 0 2048 2048"
            className={classes.svg}
        >
            <path
                className={cx(iconClassNames.outline, classes.outlinePart)}
                d="M2048 1408v128H250l163 163-90 90L6 1472l317-317 90 90-163 163h1798zm-413-605l163-163H0V512h1798l-163-163 90-90 317 317-317 317-90-90z"
            />
            <path
                className={cx(iconClassNames.filled, classes.filledPart)}
                d="M2048 1408v128H250l163 163-90 90L6 1472l317-317 90 90-163 163h1798zm-413-605l163-163H0V512h1798l-163-163 90-90 317 317-317 317-90-90z"
            />
        </svg>
    ),
    displayName: 'SwitchIcon',
});
