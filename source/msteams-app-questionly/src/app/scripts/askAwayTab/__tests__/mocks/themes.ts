// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemePrepared } from '@fluentui/react-northstar';

export const themeMock: ThemePrepared = {
    siteVariables: {
        fontSizes: {
            smaller: '0.625rem',
            small: '0.75rem',
            medium: '0.875rem',
            large: '1.125rem',
            larger: '1.5rem',
        },
        colorScheme: {
            default: {
                foreground1: '#484644',
                background5: '#979593',
                foregroundDisabled: '#C8C6C4',
                backgroundHover: '#F3F2F1',
                foreground4: '#fff',
                foregroundDisabled1: '#000',
                foreground3: '#fff',
                foreground: '#fff',
                background: '#2D2C2C',
                border: '#605E5C',
                shadow: '#000',
                foregroundHover: '#fff',
            },
            brand: {
                foreground4: '#fff',
                foreground: '#A6A7DC',
                background: '#6264A7',
                border: '#605E5C',
                shadow: '#000',
                foregroundHover: '#A6A7DC',
            },
            green: {
                foreground4: '',
                foreground1: '#fff',
                foreground: '#92C353',
                background: '#92C353',
                border: undefined,
                shadow: undefined,
                foregroundHover: undefined,
            },
            onyx: {
                border1: '#fff',
                foreground: undefined,
                background: 'rgba(41,40,40,0.9)',
                border: 'rgba(27,26,26,0.9)',
                shadow: undefined,
                foregroundHover: undefined,
            },
        },
    },
    componentVariables: {},
    componentStyles: {},
    fontFaces: [],
    staticStyles: [],
    animations: {},
};
