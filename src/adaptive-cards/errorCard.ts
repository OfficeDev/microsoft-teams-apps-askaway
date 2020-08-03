import { IAdaptiveCard } from 'adaptivecards';

/**
 * Adaptive card for when a task/fetch fails.
 */
export const errorCard = () =>
    <IAdaptiveCard>{
        $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.0',
        body: [
            {
                type: 'TextBlock',
                text: '${errorMessage}',
            },
        ],
    };
