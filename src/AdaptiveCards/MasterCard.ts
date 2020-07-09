import { IAdaptiveCard } from 'adaptivecards';
import { err, ok, Result } from '../util';
import { ISubmitAction } from 'adaptivecards/lib/schema';

/**
 * Adaptive Card template for view leaderboard submit action (i.e, the `View Leaderboard` button).
 */
export const viewLeaderboardButton: ISubmitAction = {
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
            text: '${actionBy} ${user}',
            wrap: true,
            isSubtle: true,
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
        {
            id: 'endAMA',
            type: 'Action.Submit',
            title: 'End AMA',
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
        console.error(error);
        return err(error);
    }
};
