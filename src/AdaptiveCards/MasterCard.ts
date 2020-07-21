import { IAdaptiveCard } from 'adaptivecards';
import { err, ok, Result } from '../util';
import { ISubmitAction } from 'adaptivecards/lib/schema';
import { aiClient } from '../app/server';

/**
 * Adaptive Card template for view leaderboard submit action (i.e, the `View Leaderboard` button).
 */
export const viewLeaderboardButton: ISubmitAction = {
    id: 'viewLeaderboard',
    type: 'Action.Submit',
    title: 'Upvote questions',
    data: {
        msteams: {
            type: 'task/fetch',
        },
        id: 'viewLeaderboard',
        amaSessionId: '${amaId}',
        aadObjectId: '${userId}',
    },
};

/**
 * Data injected into the MasterCard
 */
export type MasterCardData = {
    title: string;
    description: string;
    userName: string;
    amaSessionId: string;
    userId: string;
    ended: boolean;
};

/**
 * Master Adaptive Card for the Questionly Bot
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
            text: 'Updated ${dateLastUpdated}',
            wrap: true,
            size: 'Small',
            isSubtle: true,
            $when: '${count($root.dateLastUpdated) > 0}',
        },
        {
            type: 'Container',
            spacing: 'Large',
            items: [
                {
                    type: 'ColumnSet',
                    columns: [
                        {
                            type: 'Column',
                            width: 'stretch',
                            items: [
                                {
                                    type: 'TextBlock',
                                    text: 'Top questions',
                                    wrap: true,
                                    size: 'Medium',
                                    weight: 'Bolder',
                                },
                            ],
                        },
                        {
                            type: 'Column',
                            width: 'auto',
                            items: [
                                {
                                    type: 'TextBlock',
                                    text: 'Upvotes',
                                    wrap: true,
                                    weight: 'Lighter',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'TextBlock',
                    text: 'Be the first to ask a question.',
                    color: 'accent',
                    $when: '${count($root.topQuestions) < 1}',
                },
                {
                    type: 'Container',
                    separator: true,
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
                                            text: '${string(upvotes)}',
                                        },
                                    ],
                                    verticalContentAlignment: 'Center',
                                },
                            ],
                        },
                    ],
                    $data: '${$root.topQuestions}',
                },
            ],
            wrap: true,
        },
        {
            type: 'ActionSet',
            separator: true,
            spacing: 'Large',
            horizontalAlignment: 'Center',
            actions: [
                {
                    type: 'Action.ShowCard',
                    title: 'Show Recent Questions',
                    card: {
                        $schema:
                            'http://adaptivecards.io/schemas/adaptive-card.json',
                        type: 'AdaptiveCard',
                        version: '1.2',
                        body: [
                            {
                                type: 'Container',
                                spacing: 'Large',
                                id: 'recentQuestions',
                                items: [
                                    {
                                        type: 'ColumnSet',
                                        columns: [
                                            {
                                                type: 'Column',
                                                width: 'stretch',
                                                items: [
                                                    {
                                                        type: 'TextBlock',
                                                        text:
                                                            'Recent questions',
                                                        wrap: true,
                                                        weight: 'Bolder',
                                                        size: 'Medium',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        type: 'TextBlock',
                                        text: 'Be the first to ask a question.',
                                        color: 'accent',
                                        $when:
                                            '${count($root.recentQuestions) < 1}',
                                    },
                                    {
                                        type: 'Container',
                                        separator: true,
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
                                                                url:
                                                                    '${userId.picture}',
                                                            },
                                                        ],
                                                    },
                                                    {
                                                        type: 'Column',
                                                        width: 'stretch',
                                                        items: [
                                                            {
                                                                type:
                                                                    'TextBlock',
                                                                text:
                                                                    '${userId.userName}',
                                                                weight:
                                                                    'Bolder',
                                                            },
                                                            {
                                                                type:
                                                                    'TextBlock',
                                                                text:
                                                                    '${content}',
                                                                spacing: 'None',
                                                            },
                                                        ],
                                                    },
                                                    {
                                                        type: 'Column',
                                                        width: 'auto',
                                                        items: [
                                                            {
                                                                type:
                                                                    'TextBlock',
                                                                text:
                                                                    '${string(upvotes)}',
                                                            },
                                                        ],
                                                        verticalContentAlignment:
                                                            'Center',
                                                    },
                                                ],
                                            },
                                        ],
                                        $data: '${$root.recentQuestions}',
                                    },
                                ],
                                wrap: true,
                            },
                        ],
                    },
                },
            ],
        },
        {
            type: 'TextBlock',
            text: '${sessionDetails}',
            wrap: true,
            spacing: 'Large',
        },
        {
            type: 'ActionSet',
            isVisible: 'false',
            actions: [
                {
                    type: 'Action.Submit',
                    title: 'Data Store',
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
        viewLeaderboardButton,
    ],
};

/**
 * Extracts injected data from the master card
 * @param card - the master card
 */
export const extractMasterCardData = (
    card: IAdaptiveCard
): Result<MasterCardData, null> => {
    try {
        if (!card.body) throw Error('Non-existent card body');
        return ok(card.body[card.body.length - 1].actions[0].data);
    } catch (error) {
        aiClient.trackException({ exception: error });
        return err(error);
    }
};
