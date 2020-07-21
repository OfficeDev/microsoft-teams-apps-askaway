'use strict';

import { IAdaptiveCard } from 'adaptivecards';

/**
 * Defines the template for the adaptive card used when confirming the ending of the QnA.
 */
export default () =>
    <IAdaptiveCard>{
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.0',
        body: [
            {
                type: 'TextBlock',
                text: 'Are you sure you want to stop gathering questions?',
                size: 'large',
            },
        ],
        actions: [
            {
                id: 'cancelEndQnA',
                type: 'Action.Submit',
                title: 'Cancel',
                data: {
                    qnaSessionId: '${qnaId}',
                    id: 'cancelEndQnA',
                },
            },
            {
                id: 'submitEndQnA',
                type: 'Action.Submit',
                title: 'End session',
                data: {
                    qnaSessionId: '${qnaId}',
                    id: 'submitEndQnA',
                },
            },
        ],
    };
