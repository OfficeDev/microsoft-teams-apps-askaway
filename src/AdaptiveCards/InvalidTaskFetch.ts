/**
 * Adaptive card for when a task/fetch fails.
 */
export default {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.0',
    body: [
        {
            type: 'TextBlock',
            text: 'Fetching task module failed.',
        },
    ],
};
