'use strict';

import { IAdaptiveCard } from 'adaptivecards';

/**
 * Defines the template for the adaptive card used when confirming the ending of the AMA.
 */
export default <IAdaptiveCard>{
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.0',
    body: [
        {
            type: 'TextBlock',
            text: 'End the AMA. I am aware this cannot be undone.',
            size: 'large',
        },
    ],
    actions: [
        {
            id: 'submitEndAma',
            type: 'Action.Submit',
            title: 'Submit',
            data: {
                amaSessionId: '${amaId}',
                id: 'submitEndAma',
            },
        },
        {
            id: 'cancelEndAma',
            type: 'Action.Submit',
            title: 'Cancel',
            data: {
                amaSessionId: '${amaId}',
                id: 'cancelEndAma',
            },
        },
    ],
};
