/**
 * Leaderboard adaptive card template. Fields must be filled in using a data payload with the templating sdk.
 */
export const Leaderboard = {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.2',
    body: [
        {
            type: 'TextBlock',
            text: 'My Questions',
            weight: 'Bolder',
            $when: '${$root.userHasQuestions}',
        },
        {
            type: 'Container',
            items: [
                {
                    type: 'Container',
                    items: [
                        {
                            type: 'ColumnSet',
                            columns: [
                                {
                                    type: 'Column',
                                    width: 'auto',
                                    items: [
                                        {
                                            type: 'Image',
                                            url: '${userId.picture}',
                                            style: 'Person',
                                            size: 'Small',
                                        },
                                    ],
                                },
                                {
                                    type: 'Column',
                                    width: 'stretch',
                                    items: [
                                        {
                                            type: 'Container',
                                            items: [
                                                {
                                                    type: 'TextBlock',
                                                    text: '${userId.userName}',
                                                    weight: 'Bolder',
                                                },
                                                {
                                                    type: 'TextBlock',
                                                    text: '${content}',
                                                    spacing: 'None',
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: 'Column',
                                    width: 'auto',
                                    items: [
                                        {
                                            type: 'TextBlock',
                                            text: '${upvotes} ↑',
                                        },
                                    ],
                                    verticalContentAlignment: 'Center',
                                },
                            ],
                            $when: '${$root.userHasQuestions}',
                        },
                    ],
                },
            ],
            $data: '${$root.userQuestions}',
        },
        {
            type: 'TextBlock',
            text: 'All Questions',
            weight: 'Bolder',
        },
        {
            type: 'Container',
            items: [
                {
                    type: 'Container',
                    items: [
                        {
                            type: 'ColumnSet',
                            columns: [
                                {
                                    type: 'Column',
                                    width: 'auto',
                                    items: [
                                        {
                                            type: 'Image',
                                            style: 'Person',
                                            size: 'Small',
                                            url: '${userId.picture}',
                                        },
                                    ],
                                },
                                {
                                    type: 'Column',
                                    width: 'stretch',
                                    items: [
                                        {
                                            type: 'TextBlock',
                                            text: '${userId.userName}',
                                            weight: 'Bolder',
                                        },
                                        {
                                            type: 'TextBlock',
                                            text: '${content}',
                                            spacing: 'None',
                                        },
                                    ],
                                },
                                {
                                    type: 'Column',
                                    width: 'auto',
                                    items: [
                                        {
                                            type: 'TextBlock',
                                            text: '${upvotes} ↑',
                                            $when: '${!upvotable}',
                                        },
                                        {
                                            type: 'Container',
                                            items: [
                                                {
                                                    type: 'TextBlock',
                                                    text: '${upvotes} ↑',
                                                },
                                            ],
                                            selectAction: {
                                                type: 'Action.Submit',
                                                id: 'upvote',
                                                data: '${_id}',
                                            },
                                            $when: '${upvotable}',
                                        },
                                    ],
                                    verticalContentAlignment: 'Center',
                                },
                            ],
                        },
                    ],
                },
            ],
            $data: '${$root.questions}',
        },
    ],
};

/**
 * Adaptive card for an empty leaderboard when there are no questions in an AMA.
 */
export const LeaderboardEmpty = {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.0',
    body: [
        {
            type: 'TextBlock',
            text: 'There are no questions to show.',
        },
    ],
};

/**
 * Adaptive card informing the user that retrieving the leaderboard failed.
 */
export const LeaderboardFailed = {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.0',
    body: [
        {
            type: 'TextBlock',
            text: 'Retrieving Leaderboard Failed.',
        },
    ],
};
