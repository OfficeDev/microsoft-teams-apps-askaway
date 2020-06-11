export default {
    contentType: 'application/vnd.microsoft.card.adaptive',
    content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.0',
        body: [
            {
                type: 'Container',
                backgroundImage:
                    'https://raw.githubusercontent.com/manasisharma/headshots/master/1920x1080%238a8bbd.png',
                bleed: true,
                items: [
                    {
                        type: 'TextBlock',
                        text: '',
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
                text: '',
                wrap: true,
                size: 'medium',
            },
            {
                type: 'Container',
                items: [
                    {
                        type: 'TextBlock',
                        text: 'Question Leaderboard',
                        wrap: true,
                        isSubtle: true,
                    },
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
                text: 'Created by {USER}',
                wrap: true,
                isSubtle: true,
            },
        ],
        actions: [
            {
                type: 'Action.ShowCard',
                title: 'Ask a question',
                card: {
                    type: 'AdaptiveCard',
                    body: [
                        {
                            type: 'Input.Text',
                            id: 'askQuestion',
                            isMultiline: true,
                            placeholder: 'Enter your question',
                        },
                    ],
                    actions: [
                        {
                            type: 'Action.Submit',
                            title: 'Submit Question',
                            data: {
                                id: 'random value',
                            },
                        },
                    ],
                },
            },
            {
                type: 'Action.Submit',
                title: 'View leaderboard',
                data: {
                    msteams: {
                        type: 'task/fetch',
                    },
                },
            },
        ],
        msteams: {
            entities: [],
        },
    },
};
