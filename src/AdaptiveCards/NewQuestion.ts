'use strict';

/**
 * Defines the template for the adaptive card used when creating a new question.
 */
export default {
    version: '1.0.0',
    type: 'AdaptiveCard',
    body: [
        {
            type: 'TextBlock',
            text: `Ask a Question`,
        },
        {
            type: 'Input.Text',
            id: 'usertext',
            placeholder: 'Ex. What is your favourite type of pizza?',
            isMultiline: true,
        },
    ],
    actions: [
        {
            type: 'Action.Submit',
            title: 'Submit',
            data: {
                amaSessionId: '${AMA_ID}',
            },
        },
    ],
};
