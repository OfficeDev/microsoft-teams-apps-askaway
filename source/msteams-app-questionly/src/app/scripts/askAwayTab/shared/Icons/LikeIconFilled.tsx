import * as React from 'react';
import { createSvgIcon } from '@fluentui/react-icons-northstar/dist/dts/src/utils/createSvgIcon';
export const LikeIconFilled = createSvgIcon({
    svg: ({ classes }) => (
        <svg role="presentation" focusable="false" viewBox="8 8 16 16" className={classes.svg}>
            <path
                style={{ display: 'block' }}
                className={'ui-icon__filled'}
                d="M21.981 15.308c-.016-.057-.412-1.389-2.103-1.444a15.34 15.34 0 0 0-.522-.008c-.153 0-.305.001-.458.003-.152.001-.306.003-.462.003-.444 0-.694-.036-.83-.068l.038-.06a4.03 4.03 0 0 0 .074-.122c.458-.796.78-2.303.748-2.865-.082-1.386-.636-2.247-1.447-2.247-.497 0-.603.426-.917 1.692-.081.328-.205.825-.258.934-.115.214-1.363 1.975-3.102 4.378a1.001 1.001 0 0 0-.142.887l1.747 5.51a1 1 0 0 0 .919.697l2.233.077h.003c.152 0 2.612-.028 3.276-1.577.026-.06.041-.096 1.212-5.55a.513.513 0 0 0-.009-.24zM10.605 15.921a.5.5 0 1 0-.952.304l2.371 7.427a.498.498 0 0 0 .628.324.5.5 0 0 0 .324-.628l-2.371-7.427z"
            />
        </svg>
    ),
    displayName: 'LikeIconFilled',
});
