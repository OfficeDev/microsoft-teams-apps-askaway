import { IAdaptiveCard } from 'adaptivecards';

/**
 * Defines the template for the adaptive card used when creating a new question.
 */
export default () =>
    <IAdaptiveCard>{
        version: '1.0.0',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                text:
                    'Something went wrong submitting your question. Try again.',
                color: 'attention',
                $when: '${question != null}',
            },
            {
                type: 'TextBlock',
                text: 'Question (250 characters max)',
            },
            {
                type: 'Input.Text',
                id: 'usertext',
                placeholder: 'Type a question',
                maxLength: 250,
                isMultiline: true,
                value: '${if(question != null, question, null)}',
            },
        ],
        actions: [
            {
                id: 'submitQuestion',
                type: 'Action.Submit',
                title: 'Submit',
                data: {
                    id: 'submitQuestion',
                    amaSessionId: '${amaId}',
                },
            },
        ],
    };
