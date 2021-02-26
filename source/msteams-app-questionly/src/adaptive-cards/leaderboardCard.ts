import { IAdaptiveCard } from 'adaptivecards';
import { ISubmitAction } from 'adaptivecards/lib/schema';
import { genericStrings, leaderboardStrings } from 'src/localization/locale';

/**
 * End QnA button
 */
export const endQnAButton: () => ISubmitAction = () =>
    <ISubmitAction>{
        id: 'confirmEndQnA',
        type: 'Action.Submit',
        title: genericStrings('endSession'),
        data: {
            id: 'confirmEndQnA',
            qnaSessionId: '${qnaId}',
        },
    };

export const refreshButton: () => ISubmitAction = () =>
    <ISubmitAction>{
        id: 'refreshLeaderboard',
        type: 'Action.Submit',
        title: leaderboardStrings('refresh'),
        data: {
            id: 'refreshLeaderboard',
            qnaSessionId: '${qnaId}',
        },
    };

/**
 * Leaderboard adaptive card template. Fields must be filled in using a data payload with the templating sdk.
 */
export const leaderboardCard = () =>
    <IAdaptiveCard>{
        type: 'AdaptiveCard',
        // eslint-disable-next-line @typescript-eslint/tslint/config
        $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.2',
        body: [
            {
                type: 'TextBlock',
                text: leaderboardStrings('yourQuestions'),
                weight: 'bolder',
                $when: '${$root.userHasQuestions}',
            },
            myQuestions,
            {
                type: 'TextBlock',
                text: leaderboardStrings('allQuestions'),
                weight: 'bolder',
            },
            getAllQuestionsContainer(),
            {
                type: 'ActionSet',
                actions: [refreshButton(), endQnAButton()],
                $when: '${isActive}',
            },
        ],
    };

/**
 * Adaptive card for an empty leaderboard when there are no questions in an QnA.
 */
export const leaderboardEmptyCard = () =>
    <IAdaptiveCard>{
        $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.0',
        body: [
            {
                type: 'TextBlock',
                text: leaderboardStrings('noQuestions'),
            },
            {
                type: 'ActionSet',
                style: 'destructive',
                actions: [refreshButton(), endQnAButton()],
                $when: '${isActive}',
            },
        ],
    };

const myQuestions = {
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
                                    size: 'Small',
                                },
                                {
                                    type: 'TextBlock',
                                    text: '${content}',
                                    spacing: 'None',
                                    wrap: true,
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
                            text: '${upvotes} ',
                            size: 'Medium',
                        },
                    ],
                    verticalContentAlignment: 'Center',
                },
            ],
            $data: '${$root.userQuestions}',
        },
    ],
    $when: '${$root.userHasQuestions}',
};

const getAllQuestionsContainer = () => {
    return {
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
                                type: 'Container',
                                items: [
                                    {
                                        type: 'TextBlock',
                                        text: '${userId.userName}',
                                        weight: 'Bolder',
                                        size: 'Small',
                                    },
                                    {
                                        type: 'TextBlock',
                                        text: '${content}',
                                        spacing: 'None',
                                        wrap: true,
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
                                type: 'Container',
                                items: [
                                    {
                                        type: 'Container',
                                        items: [
                                            {
                                                type: 'Image',
                                                url: '${$root.upvoteArrow}',
                                                width: '20px',
                                                selectAction: {
                                                    type: 'Action.Submit',
                                                    id: 'upvote',
                                                    data: {
                                                        id: 'upvote',
                                                        questionId: '${_id}',
                                                        qnaSessionId: '${qnaSessionId}',
                                                    },
                                                },
                                                $when: '${!upvoted}',
                                            },
                                            {
                                                type: 'Image',
                                                url: `https://${process.env.HostName}/images/thumbs_up_filled.png`,
                                                width: '20px',
                                                selectAction: {
                                                    type: 'Action.Submit',
                                                    id: 'upvote',
                                                    data: {
                                                        id: 'upvote',
                                                        questionId: '${_id}',
                                                        qnaSessionId: '${qnaSessionId}',
                                                    },
                                                },
                                                $when: '${upvoted}',
                                            },
                                        ],
                                        $when: '${upvotable && isActive}',
                                    },
                                    {
                                        type: 'TextBlock',
                                        text: ' ',
                                        $when: '${!upvotable || !isActive}',
                                    },
                                ],
                            },
                        ],
                        verticalContentAlignment: 'Center',
                    },
                    {
                        type: 'Column',
                        width: 'auto',
                        items: [
                            {
                                type: 'Container',
                                items: [
                                    {
                                        type: 'TextBlock',
                                        text: '${upvotes} ',
                                        size: 'Medium',
                                        $when: '${!upvoted}',
                                    },
                                    {
                                        type: 'TextBlock',
                                        text: '${upvotes} ',
                                        size: 'Medium',
                                        color: 'Accent',
                                        weight: 'Bolder',
                                        $when: '${upvoted}',
                                    },
                                ],
                                $when: '${!upvotable || !isActive}',
                            },
                            {
                                type: 'Container',
                                items: [
                                    {
                                        type: 'TextBlock',
                                        text: '${upvotes} ',
                                        size: 'Medium',
                                        $when: '${!upvoted}',
                                    },
                                    {
                                        type: 'TextBlock',
                                        text: '${upvotes} ',
                                        size: 'Medium',
                                        color: 'Accent',
                                        weight: 'Bolder',
                                        $when: '${upvoted}',
                                    },
                                ],
                                selectAction: {
                                    type: 'Action.Submit',
                                    id: 'upvote',
                                    data: {
                                        id: 'upvote',
                                        questionId: '${_id}',
                                        qnaSessionId: '${qnaSessionId}',
                                    },
                                },
                                $when: '${upvotable && isActive}',
                            },
                        ],
                        verticalContentAlignment: 'Center',
                    },
                ],
                $data: '${$root.questions}',
            },
        ],
    };
};
