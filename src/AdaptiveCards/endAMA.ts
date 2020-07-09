'use strict';

import { IAdaptiveCard } from 'adaptivecards';

/**
 * Defines the template for the master card displayed for an ended AMA.
 */
export default <IAdaptiveCard>{
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.2',
    body: [
        {
            type: 'Container',
            backgroundImage: '${image}',
            bleed: true,
            items: [
                {
                    type: 'TextBlock',
                    text: '${title}',
                    wrap: true,
                    weight: 'bolder',
                    size: 'large',
                    color: 'light',
                    horizontalAlignment: 'left',
                },
            ],
            wrap: true,
        },
        {
            type: 'TextBlock',
            text: '${description}',
            wrap: true,
            size: 'medium',
        },
        {
            type: 'TextBlock',
            text: 'Ended by ${user}',
            wrap: true,
            isSubtle: true,
        },
    ],
    actions: [
        {
            id: 'viewLeaderboard',
            type: 'Action.Submit',
            title: 'View leaderboard',
            data: {
                msteams: {
                    type: 'task/fetch',
                },
                id: 'viewLeaderboard',
                amaSessionId: '${amaId}',
            },
        },
    ],
};
