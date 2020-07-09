import {
    getResubmitQuestionErrorCard,
    _adaptiveCard,
    getEndAMAMastercard,
    getEndAMAConfirmationCard,
    getNewQuestionCard,
} from '../AdaptiveCards/AdaptiveCardBuilder';
import { IAdaptiveCard } from 'adaptivecards';

const sampleAMASessionId = '431343432434';
const sampleTitle = 'AMA Title';
const sampleDesc = 'AMA Desc';
const sampleName = 'Sample Name';
const sampleUserAAdObjId = '2343243243';
const sampleImage =
    'https://github.com/kavins14/random/blob/master/title_bg.png?raw=true';
const sampleQuestionContent = 'Do pineapples belong on pizza?';
const sampleEmptyQuestionContent = '';

test('resubmit card from empty question', () => {
    const card = getResubmitQuestionErrorCard(
        sampleAMASessionId,
        sampleEmptyQuestionContent
    );
    const expectedCard = <IAdaptiveCard>{
        version: '1.0.0',
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                text:
                    'There was an error submitting your question. Please try again.',
            },
            {
                type: 'Input.Text',
                id: 'usertext',
                maxLength: 250,
                isMultiline: true,
                value: sampleEmptyQuestionContent,
            },
            {
                type: 'TextBlock',
                text: 'Maximum number of characters: 250',
            },
        ],
        actions: [
            {
                id: 'submitQuestion',
                type: 'Action.Submit',
                title: 'Submit',
                data: {
                    amaSessionId: sampleAMASessionId,
                    id: 'submitQuestion',
                },
            },
        ],
    };
    expect(card).toEqual(_adaptiveCard(expectedCard));
});

test('resubmit card from non-empty question', () => {
    const card = getResubmitQuestionErrorCard(
        sampleAMASessionId,
        sampleQuestionContent
    );
    const expectedCard = <IAdaptiveCard>{
        version: '1.0.0',
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                text:
                    'There was an error submitting your question. Please try again.',
            },
            {
                type: 'Input.Text',
                id: 'usertext',
                maxLength: 250,
                isMultiline: true,
                value: sampleQuestionContent,
            },
            {
                type: 'TextBlock',
                text: 'Maximum number of characters: 250',
            },
        ],
        actions: [
            {
                id: 'submitQuestion',
                type: 'Action.Submit',
                title: 'Submit',
                data: {
                    amaSessionId: sampleAMASessionId,
                    id: 'submitQuestion',
                },
            },
        ],
    };
    expect(card).toEqual(_adaptiveCard(expectedCard));
});

test('get end AMA mastercard', () => {
    const card = getEndAMAMastercard(
        sampleTitle,
        sampleDesc,
        sampleAMASessionId,
        sampleName
    );

    const expectedCard = <IAdaptiveCard>{
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.2',
        body: [
            {
                type: 'Container',
                backgroundImage: sampleImage,
                bleed: true,
                items: [
                    {
                        type: 'TextBlock',
                        text: sampleTitle,
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
                text: sampleDesc,
                wrap: true,
                size: 'medium',
            },
            {
                type: 'TextBlock',
                text: 'Ended by ' + sampleName,
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
                    amaSessionId: sampleAMASessionId,
                },
            },
        ],
    };

    expect(card).toEqual(_adaptiveCard(expectedCard));
});

test('get end AMA confirmation card', () => {
    const card = getEndAMAConfirmationCard(sampleAMASessionId);
    const expectedCard = <IAdaptiveCard>{
        $schema: sampleImage,
        type: 'AdaptiveCard',
        version: '1.0',
        body: [
            {
                type: 'Container',
                bleed: true,
                items: [
                    {
                        type: 'Input.Toggle',
                        id: 'endAMAToggle',
                        title: 'End the AMA. I am aware this cannot be undone.',
                        value: 'false',
                    },
                ],
                wrap: true,
            },
        ],
        actions: [
            {
                id: 'submitEndAma',
                type: 'Action.Submit',
                title: 'Submit',
                data: {
                    amaSessionId: sampleAMASessionId,
                    id: 'submitEndAma',
                },
            },
        ],
    };

    expect(card).toEqual(_adaptiveCard(expectedCard));
});

test('get new question card', () => {
    const card = getNewQuestionCard(sampleAMASessionId);
    const expectedCard = <IAdaptiveCard>{
        version: '1.0.0',
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                text: `Ask a Question`,
            },
            {
                type: 'Input.Text',
                id: 'usertext',
                placeholder: 'Ex. What is your favourite type of pizza?',
                maxLength: 250,
                isMultiline: true,
            },
            {
                type: 'TextBlock',
                text: 'Maximum number of characters: 250',
            },
        ],
        actions: [
            {
                id: 'submitQuestion',
                type: 'Action.Submit',
                title: 'Submit',
                data: {
                    amaSessionId: sampleAMASessionId,
                    id: 'submitQuestion',
                },
            },
        ],
    };

    expect(card).toEqual(_adaptiveCard(expectedCard));
});
