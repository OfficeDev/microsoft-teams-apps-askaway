/**
 * Master Adaptive Card for the Questionly Bot
 */

import { IAdaptiveCard } from 'adaptivecards';

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
            type: 'Container',
            items: [
                {
                    type: 'TextBlock',
                    text: 'No questions yet. Be the first one to ask.',
                    color: 'accent',
                },
            ],
            wrap: true,
        },
        {
            type: 'TextBlock',
            text: 'Initiated by ${user}',
            wrap: true,
            isSubtle: true,
        },
        {
            type: 'ActionSet',
            isVisible: 'false',
            actions: [
                {
                    type: 'Action.Submit',
                    title: 'Ask a question',
                    data: '${data}',
                },
            ],
        },
    ],
    actions: [
        {
            id: 'askQuestion',
            type: 'Action.Submit',
            title: 'Ask a question',
            data: {
                msteams: {
                    type: 'task/fetch',
                },
                id: 'askQuestion',
                amaSessionId: '${amaId}',
            },
        },
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
                aadObjectId: '${userId}',
            },
        },
        {
            id: 'endAMA',
            type: 'Action.Submit',
            title: 'End the AMA',
            data: {
                msteams: {
                    type: 'task/fetch',
                },
                id: 'endAMA',
                amaSessionId: '${amaId}',
            },
        },
    ],
};
