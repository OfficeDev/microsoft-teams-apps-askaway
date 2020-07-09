import { IAdaptiveCard } from 'adaptivecards';

/**
 * Defines the template for the adaptive card used when errors occur when creating a new question.
 */
export default <IAdaptiveCard>{
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.0',
    body: [
        {
            type: 'TextBlock',
            text: `Something went wrong. Please try submitting a question again.`,
        },
    ],
};
