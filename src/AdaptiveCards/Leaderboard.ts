import { IAdaptiveCard } from 'adaptivecards';
import { ISubmitAction } from 'adaptivecards/lib/schema';

/**
 * End AMA button
 */
export const endAMAButton: () => ISubmitAction = () =>
    <ISubmitAction>{
        id: 'confirmEndAMA',
        type: 'Action.Submit',
        title: 'End session',
        data: {
            id: 'confirmEndAMA',
            amaSessionId: '${amaId}',
        },
    };

/**
 * Leaderboard adaptive card template. Fields must be filled in using a data payload with the templating sdk.
 */
export const Leaderboard = () =>
    <IAdaptiveCard>{
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.2',
        body: [
            {
                type: 'TextBlock',
                text: 'My questions',
                weight: 'bolder',
                $when: '${$root.userHasQuestions}',
            },
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
                        $when: '${$root.userHasQuestions}',
                        $data: '${$root.userQuestions}',
                    },
                ],
            },
            {
                type: 'TextBlock',
                text: 'All questions',
                weight: 'bolder',
            },
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
                                                        type: 'TextBlock',
                                                        text: '⭡',
                                                        size: 'Large',
                                                        $when: '${!upvoted}',
                                                    },
                                                    {
                                                        type: 'TextBlock',
                                                        text: '⭡',
                                                        size: 'Large',
                                                        color: 'Accent',
                                                        $when: '${upvoted}',
                                                    },
                                                ],
                                                selectAction: {
                                                    type: 'Action.Submit',
                                                    id: 'upvote',
                                                    data: {
                                                        id: 'upvote',
                                                        questionId: '${_id}',
                                                        amaSessionId:
                                                            '${amaSessionId}',
                                                    },
                                                },
                                                $when:
                                                    '${upvotable && isActive}',
                                            },
                                            {
                                                type: 'TextBlock',
                                                text: ' ',
                                                $when:
                                                    '${!upvotable || !isActive}',
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
                                    },
                                ],
                                verticalContentAlignment: 'Center',
                            },
                        ],
                        $data: '${$root.questions}',
                    },
                ],
            },
            {
                type: 'ActionSet',
                $when: '${isUserHost && isActive}',
                actions: [endAMAButton()],
            },
        ],
    };

/**
 * Adaptive card for an empty leaderboard when there are no questions in an AMA.
 */
export const LeaderboardEmpty = () =>
    <IAdaptiveCard>{
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.0',
        body: [
            {
                type: 'TextBlock',
                text: 'There are no questions to show.',
            },
            {
                type: 'ActionSet',
                $when: '${isUserHost && isActive}',
                style: 'destructive',
                actions: [endAMAButton()],
            },
        ],
    };
