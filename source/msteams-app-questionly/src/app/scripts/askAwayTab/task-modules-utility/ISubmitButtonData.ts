/**
 * Submit action metadata.
 */
export interface ISubmitButtonData {
    /**
     * Id assigned to the button.
     */
    id: SubmitButtonId;
    /**
     * Button title.
     */
    title: string;
}

/**
 * Button ids.
 */
export enum SubmitButtonId {
    /**
     * `End session` button id.
     */
    SubmitEndQnA = 0,
    /**
     * `Cancel` button id.
     */
    Cancel = 1,
    /**
     * `Ok` button id.
     */
    Ok = 2,
}
