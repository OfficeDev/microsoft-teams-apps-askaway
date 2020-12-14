// tslint:disable-next-line:export-name
export const getBaseUrl = (): string => {
    return window.location.origin + '/api';
};

// [Constant Values]
export const CONST = Object.freeze({
    TAB_FRAME_CONTEXT: {
        FC_SIDEPANEL: 'sidePanel',
        FC_CONTENT: 'content',
    },
});
