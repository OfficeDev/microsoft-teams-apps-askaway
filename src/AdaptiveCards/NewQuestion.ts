import { IAdaptiveCard } from 'adaptivecards';

/**
 * Defines the template for the adaptive card used when creating a new question.
 */
export default <IAdaptiveCard>{
    version: '1.0.0',
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    body: [
        {
            type: 'TextBlock',
            text:
                'There was an error submitting your question. Please try again.',
            color: 'attention',
            $when: '${question != null}',
        },
        {
            type: 'Input.Text',
            id: 'usertext',
            placeholder: 'Ex. What is your favourite type of pizza?',
            maxLength: 250,
            isMultiline: true,
            value: '${if(question != null, question, null)}',
        },
        {
            type: 'TextBlock',
            text: 'Maximum number of characters: 250',
        },
    ],
    actions: [
        {
            id: 'submitQuestion',
            type: 'Action.Submit',
            title: 'Submit',
            data: {
                amaSessionId: '${amaId}',
                id: 'submitQuestion',
            },
        },
    ],
};
