/* eslint-disable @typescript-eslint/tslint/config */
import {
    getNewQuestionCard,
    _adaptiveCard,
    getEndQnAConfirmationCard,
    getResubmitQuestionErrorCard,
    getErrorCard,
    getStartQnACard,
    generateLeaderboard,
    getPersonImage,
} from 'src/AdaptiveCards/AdaptiveCardBuilder';
import {
    initLocalization,
    errorStrings,
    askQuestionStrings,
    leaderboardStrings,
    endQnAStrings,
    startQnAStrings,
    genericStrings,
} from 'src/localization/locale';
import { IAdaptiveCard } from 'adaptivecards/lib/schema';
import { IQuestionPopulatedUser } from 'src/Data/Schemas/Question';
import random from 'random';
import seedrandom from 'seedrandom';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';

const sampleUserAADObjId1 = 'be36140g-9729-3024-8yg1-147bbi67g2c9';
const sampleQnASessionID = '5f160b862655575054393a0e';
const sampleTitle = 'Weekly QnA Test';
const sampleDescription = 'Weekly QnA Test description';
const sampleErrorMessage = 'Sample error message';

beforeAll(async () => {
    await initLocalization();
});

describe('get start qna card', () => {
    beforeAll(async () => {
        await initLocalization();
    });

    test('get start qna card with empty fields', () => {
        const result = getStartQnACard('', '', '');
        const expected = <IAdaptiveCard>{
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.2',
            body: [
                {
                    type: 'ColumnSet',
                    columns: [
                        {
                            type: 'Column',
                            width: 2,
                            items: [
                                {
                                    type: 'Container',
                                    items: [
                                        {
                                            type: 'TextBlock',
                                            text: '',
                                            color: 'Attention',
                                        },
                                        {
                                            type: 'TextBlock',
                                            text: `${startQnAStrings(
                                                'titleFieldLabel'
                                            )}*`,
                                            wrap: true,
                                        },
                                        {
                                            type: 'Input.Text',
                                            id: 'title',
                                            value: '',
                                            maxLength: 250,
                                        },
                                        {
                                            type: 'TextBlock',
                                            text: `${startQnAStrings(
                                                'descriptionFieldLabel'
                                            )}* (250 ${genericStrings(
                                                'maxCharacters'
                                            )})`,
                                            wrap: true,
                                        },
                                        {
                                            type: 'Input.Text',
                                            id: 'description',
                                            value: '',
                                            maxLength: 250,
                                            placeholder: startQnAStrings(
                                                'descriptionFieldExample'
                                            ),
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
            actions: [
                {
                    id: 'submit',
                    type: 'Action.Submit',
                    title: genericStrings('preview'),
                },
            ],
        };
        expect(result).toEqual(_adaptiveCard(expected));
    });

    test('get start qna card with filled in fields', () => {
        const result = getStartQnACard(
            sampleTitle,
            sampleDescription,
            sampleErrorMessage
        );
        const expected = <IAdaptiveCard>{
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.2',
            body: [
                {
                    type: 'ColumnSet',
                    columns: [
                        {
                            type: 'Column',
                            width: 2,
                            items: [
                                {
                                    type: 'Container',
                                    items: [
                                        {
                                            type: 'TextBlock',
                                            text: sampleErrorMessage,
                                            color: 'Attention',
                                        },
                                        {
                                            type: 'TextBlock',
                                            text: `${startQnAStrings(
                                                'titleFieldLabel'
                                            )}*`,
                                            wrap: true,
                                        },
                                        {
                                            type: 'Input.Text',
                                            id: 'title',
                                            value: sampleTitle,
                                            maxLength: 250,
                                        },
                                        {
                                            type: 'TextBlock',
                                            text: `${startQnAStrings(
                                                'descriptionFieldLabel'
                                            )}* (250 ${genericStrings(
                                                'maxCharacters'
                                            )})`,
                                            wrap: true,
                                        },
                                        {
                                            type: 'Input.Text',
                                            id: 'description',
                                            value: sampleDescription,
                                            maxLength: 250,
                                            placeholder: startQnAStrings(
                                                'descriptionFieldExample'
                                            ),
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
            actions: [
                {
                    id: 'submit',
                    type: 'Action.Submit',
                    title: genericStrings('preview'),
                },
            ],
        };
        expect(result).toEqual(_adaptiveCard(expected));
    });
});

test('get new question card', () => {
    const result = getNewQuestionCard(sampleQnASessionID);
    const expected = <IAdaptiveCard>{
        version: '1.0.0',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                text: `${askQuestionStrings(
                    'textFieldLabel'
                )} (250 ${genericStrings('maxCharacters')})`,
            },
            {
                type: 'Input.Text',
                id: 'usertext',
                placeholder: askQuestionStrings('textFieldExample'),
                maxLength: 250,
                isMultiline: true,
            },
        ],
        actions: [
            {
                id: 'submitQuestion',
                type: 'Action.Submit',
                title: genericStrings('submit'),
                data: {
                    id: 'submitQuestion',
                    qnaSessionId: sampleQnASessionID,
                },
            },
        ],
    };
    expect(result).toEqual(_adaptiveCard(expected));
});

test('get resubmit question card', () => {
    const message = 'Testing string';
    const result = getResubmitQuestionErrorCard(sampleQnASessionID, message);
    const expected = <IAdaptiveCard>{
        version: '1.0.0',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                text: errorStrings('submittingQuestions'),
                color: 'attention',
            },
            {
                type: 'TextBlock',
                text: `${askQuestionStrings(
                    'textFieldLabel'
                )} (250 ${genericStrings('maxCharacters')})`,
            },
            {
                type: 'Input.Text',
                id: 'usertext',
                placeholder: askQuestionStrings('textFieldExample'),
                maxLength: 250,
                isMultiline: true,
                value: message,
            },
        ],
        actions: [
            {
                id: 'submitQuestion',
                type: 'Action.Submit',
                title: genericStrings('submit'),
                data: {
                    id: 'submitQuestion',
                    qnaSessionId: sampleQnASessionID,
                },
            },
        ],
    };
    expect(result).toEqual(_adaptiveCard(expected));
});

test('get end qna confirmation card', () => {
    const result = getEndQnAConfirmationCard(sampleQnASessionID);
    const expected = <IAdaptiveCard>{
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.0',
        body: [
            {
                type: 'TextBlock',
                text: endQnAStrings('prompt'),
                size: 'large',
            },
        ],
        actions: [
            {
                id: 'cancelEndQnA',
                type: 'Action.Submit',
                title: genericStrings('cancel'),
                data: {
                    qnaSessionId: sampleQnASessionID,
                    id: 'cancelEndQnA',
                },
            },
            {
                id: 'submitEndQnA',
                type: 'Action.Submit',
                title: genericStrings('endSession'),
                data: {
                    qnaSessionId: sampleQnASessionID,
                    id: 'submitEndQnA',
                },
            },
        ],
    };

    expect(result).toEqual(_adaptiveCard(expected));
});

test('get error card', () => {
    const result = getErrorCard(sampleErrorMessage);
    const expected = <IAdaptiveCard>{
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.0',
        body: [
            {
                type: 'TextBlock',
                text: sampleErrorMessage,
            },
        ],
    };
    expect(result).toEqual(_adaptiveCard(expected));
});

describe('empty leaderboard tests', () => {
    beforeAll(async () => {
        await initLocalization();
    });

    test('get empty leaderboard as active and not host', () => {
        const result = generateLeaderboard(
            [],
            sampleUserAADObjId1,
            sampleQnASessionID,
            false,
            true,
            'default'
        );
        const expected = <IAdaptiveCard>{
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.0',
            body: [
                {
                    type: 'TextBlock',
                    text: leaderboardStrings('noQuestions'),
                },
            ],
        };
        expect(result).toEqual(_adaptiveCard(expected));
    });

    test('get empty leaderboard as active and host', () => {
        const result = generateLeaderboard(
            [],
            sampleUserAADObjId1,
            sampleQnASessionID,
            true,
            true,
            'default'
        );
        const expected = <IAdaptiveCard>{
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
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
                    actions: [
                        {
                            id: 'confirmEndQnA',
                            type: 'Action.Submit',
                            title: genericStrings('endSession'),
                            data: {
                                id: 'confirmEndQnA',
                                qnaSessionId: sampleQnASessionID,
                            },
                        },
                    ],
                },
            ],
        };
        expect(result).toEqual(_adaptiveCard(expected));
    });

    test('get empty leaderboard as inactive and not host', () => {
        const result = generateLeaderboard(
            [],
            sampleUserAADObjId1,
            sampleQnASessionID,
            false,
            false,
            'default'
        );
        const expected = <IAdaptiveCard>{
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.0',
            body: [
                {
                    type: 'TextBlock',
                    text: leaderboardStrings('noQuestions'),
                },
            ],
        };
        expect(result).toEqual(_adaptiveCard(expected));
    });

    test('get empty leaderboard as inactive and host', () => {
        const result = generateLeaderboard(
            [],
            sampleUserAADObjId1,
            sampleQnASessionID,
            true,
            false,
            'default'
        );
        const expected = <IAdaptiveCard>{
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.0',
            body: [
                {
                    type: 'TextBlock',
                    text: leaderboardStrings('noQuestions'),
                },
            ],
        };
        expect(result).toEqual(_adaptiveCard(expected));
    });
});

describe('initials avatar generation tests', () => {
    beforeAll(() => {
        process.env.AvatarKey = crypto.randomBytes(13).toString();
    });

    test('initials avatar image', () => {
        const name = 'John Doe';
        const result = getPersonImage(name, sampleUserAADObjId1);

        random.use(seedrandom(sampleUserAADObjId1));
        const colorIndex = random.int(0, 13);

        if (!process.env.AvatarKey)
            return fail('AvatarKey not defined in env variable');

        const token = jwt.sign(
            {
                initials: 'JD',
                index: colorIndex,
            },
            Buffer.from(process.env.AvatarKey, 'utf8').toString('hex')
        );

        const expected = `https://${process.env.HostName}/avatar/${token}`;
        expect(result).toEqual(expected);
    });

    test('initials avatar image with empty name', () => {
        const name = '';
        const result = getPersonImage(name, sampleUserAADObjId1);

        random.use(seedrandom(sampleUserAADObjId1));

        const expected = `https://${process.env.HostName}/images/anon_avatar.png`;
        expect(result).toEqual(expected);
    });

    test('initials avatar image with name only in parentheses', () => {
        const name = '(John Doe)';
        const result = getPersonImage(name, sampleUserAADObjId1);

        random.use(seedrandom(sampleUserAADObjId1));

        const expected = `https://${process.env.HostName}/images/anon_avatar.png`;
        expect(result).toEqual(expected);
    });

    test('initials avatar image 3 part name', () => {
        const name = 'John Doe Shakespeare';
        const result = getPersonImage(name, sampleUserAADObjId1);

        random.use(seedrandom(sampleUserAADObjId1));
        const colorIndex = random.int(0, 13);

        if (!process.env.AvatarKey)
            return fail('AvatarKey not defined in env variable');

        const token = jwt.sign(
            {
                initials: 'JS',
                index: colorIndex,
            },
            Buffer.from(process.env.AvatarKey, 'utf8').toString('hex')
        );

        const expected = `https://${process.env.HostName}/avatar/${token}`;
        expect(result).toEqual(expected);
    });

    test('initials avatar image with name with parentheses', () => {
        const name = 'John (Berry) Doe (Contoso Inc)';
        const result = getPersonImage(name, sampleUserAADObjId1);

        random.use(seedrandom(sampleUserAADObjId1));
        const colorIndex = random.int(0, 13);

        if (!process.env.AvatarKey)
            return fail('AvatarKey not defined in env variable');

        const token = jwt.sign(
            {
                initials: 'JD',
                index: colorIndex,
            },
            Buffer.from(process.env.AvatarKey, 'utf8').toString('hex')
        );

        const expected = `https://${process.env.HostName}/avatar/${token}`;
        expect(result).toEqual(expected);
    });

    test('initials avatar image with name with nested parentheses', () => {
        const name = 'John (Tyler (Alderson)) Doe';
        const result = getPersonImage(name, sampleUserAADObjId1);

        random.use(seedrandom(sampleUserAADObjId1));
        const colorIndex = random.int(0, 13);

        if (!process.env.AvatarKey)
            return fail('AvatarKey not defined in env variable');

        const token = jwt.sign(
            {
                initials: 'JD',
                index: colorIndex,
            },
            Buffer.from(process.env.AvatarKey, 'utf8').toString('hex')
        );

        const expected = `https://${process.env.HostName}/avatar/${token}`;
        expect(result).toEqual(expected);
    });

    test('initials avatar image with multi-part name and parentheses', () => {
        const name = 'John (Elliot (Durden)) Doe Larry Terry (Contoso Inc)';
        const result = getPersonImage(name, sampleUserAADObjId1);

        random.use(seedrandom(sampleUserAADObjId1));
        const colorIndex = random.int(0, 13);

        if (!process.env.AvatarKey)
            return fail('AvatarKey not defined in env variable');

        const token = jwt.sign(
            {
                initials: 'JT',
                index: colorIndex,
            },
            Buffer.from(process.env.AvatarKey, 'utf8').toString('hex')
        );

        const expected = `https://${process.env.HostName}/avatar/${token}`;
        expect(result).toEqual(expected);
    });
});

describe('non-empty leaderboard tests', () => {
    beforeAll(async () => {
        await initLocalization();
        process.env.AvatarKey = crypto.randomBytes(13).toString();
    });

    test('only questions from user opening leaderboard', () => {
        const question = <IQuestionPopulatedUser>(<unknown>{
            _id: '123',
            content: 'my only question?',
            dateTimeCreated: new Date(),
            qnaSessionId: '456',
            userId: {
                _id: sampleUserAADObjId1,
                userName: 'Sample User',
            },
            voters: [],
            toObject: function () {
                return this;
            },
        });

        const questions: IQuestionPopulatedUser[] = [question];

        const result = generateLeaderboard(
            questions,
            sampleUserAADObjId1,
            '456',
            false,
            true,
            'default'
        );

        const expected = <IAdaptiveCard>{
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.2',
            body: [
                {
                    type: 'TextBlock',
                    text: leaderboardStrings('yourQuestions'),
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
                                            url: getPersonImage(
                                                question.userId.userName,
                                                question.userId._id
                                            ),
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
                                                    text:
                                                        question.userId
                                                            .userName,
                                                    weight: 'Bolder',
                                                },
                                                {
                                                    type: 'TextBlock',
                                                    text: question.content,
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
                                            text: `${question.voters.length} `,
                                            size: 'Medium',
                                        },
                                    ],
                                    verticalContentAlignment: 'Center',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'TextBlock',
                    text: leaderboardStrings('allQuestions'),
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
                                            url: getPersonImage(
                                                question.userId.userName,
                                                question.userId._id
                                            ),
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
                                                    text:
                                                        question.userId
                                                            .userName,
                                                    weight: 'Bolder',
                                                },
                                                {
                                                    type: 'TextBlock',
                                                    text: question.content,
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
                                                    type: 'TextBlock',
                                                    text: ' ',
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
                                                    text: `${question.voters.length} `,
                                                    size: 'Medium',
                                                },
                                            ],
                                        },
                                    ],
                                    verticalContentAlignment: 'Center',
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        expect(result).toEqual(_adaptiveCard(expected));
    });

    test('only questions from other users', () => {
        const question = <IQuestionPopulatedUser>(<unknown>{
            _id: '123',
            content: "another user's question?",
            dateTimeCreated: new Date(),
            qnaSessionId: '456',
            userId: {
                _id: '789',
                userName: 'Sample User',
            },
            voters: [],
            toObject: function () {
                return this;
            },
        });

        const questions: IQuestionPopulatedUser[] = [question];

        const result = generateLeaderboard(
            questions,
            sampleUserAADObjId1,
            '456',
            false,
            true,
            'default'
        );

        const expected = <IAdaptiveCard>{
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.2',
            body: [
                {
                    type: 'TextBlock',
                    text: leaderboardStrings('allQuestions'),
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
                                            url: getPersonImage(
                                                question.userId.userName,
                                                question.userId._id
                                            ),
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
                                                    text:
                                                        question.userId
                                                            .userName,
                                                    weight: 'Bolder',
                                                },
                                                {
                                                    type: 'TextBlock',
                                                    text: question.content,
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
                                                            url: `https://${process.env.HostName}/images/upvote_arrow_default.png`,
                                                            width: '12px',
                                                            selectAction: {
                                                                type:
                                                                    'Action.Submit',
                                                                id: 'upvote',
                                                                data: {
                                                                    id:
                                                                        'upvote',
                                                                    questionId:
                                                                        '123',
                                                                    qnaSessionId:
                                                                        '456',
                                                                },
                                                            },
                                                        },
                                                    ],
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
                                                    text: `${question.voters.length} `,
                                                    size: 'Medium',
                                                },
                                            ],
                                            selectAction: {
                                                type: 'Action.Submit',
                                                id: 'upvote',
                                                data: {
                                                    id: 'upvote',
                                                    questionId: '123',
                                                    qnaSessionId: '456',
                                                },
                                            },
                                        },
                                    ],
                                    verticalContentAlignment: 'Center',
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        expect(result).toEqual(_adaptiveCard(expected));
    });

    test('upvoted question while QnA active', () => {
        const question = <IQuestionPopulatedUser>(<unknown>{
            _id: '123',
            content: "another user's question?",
            dateTimeCreated: new Date(),
            qnaSessionId: '456',
            userId: {
                _id: '789',
                userName: 'Sample User',
            },
            voters: [sampleUserAADObjId1],
            toObject: function () {
                return this;
            },
        });

        const questions: IQuestionPopulatedUser[] = [question];

        const result = generateLeaderboard(
            questions,
            sampleUserAADObjId1,
            '456',
            false,
            true,
            'default'
        );

        const expected = <IAdaptiveCard>{
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.2',
            body: [
                {
                    type: 'TextBlock',
                    text: leaderboardStrings('allQuestions'),
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
                                            url: getPersonImage(
                                                question.userId.userName,
                                                question.userId._id
                                            ),
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
                                                    text:
                                                        question.userId
                                                            .userName,
                                                    weight: 'Bolder',
                                                },
                                                {
                                                    type: 'TextBlock',
                                                    text: question.content,
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
                                                            url: `https://${process.env.HostName}/images/upvote_arrow_purple.png`,
                                                            width: '12px',
                                                            selectAction: {
                                                                type:
                                                                    'Action.Submit',
                                                                id: 'upvote',
                                                                data: {
                                                                    id:
                                                                        'upvote',
                                                                    questionId:
                                                                        '123',
                                                                    qnaSessionId:
                                                                        '456',
                                                                },
                                                            },
                                                        },
                                                    ],
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
                                                    text: `${question.voters.length} `,
                                                    size: 'Medium',
                                                    color: 'Accent',
                                                    weight: 'Bolder',
                                                },
                                            ],
                                            selectAction: {
                                                type: 'Action.Submit',
                                                id: 'upvote',
                                                data: {
                                                    id: 'upvote',
                                                    questionId: '123',
                                                    qnaSessionId: '456',
                                                },
                                            },
                                        },
                                    ],
                                    verticalContentAlignment: 'Center',
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        expect(result).toEqual(_adaptiveCard(expected));
    });

    test('only questions from other users while QnA inactive', () => {
        const question = <IQuestionPopulatedUser>(<unknown>{
            _id: '123',
            content: "another user's question?",
            dateTimeCreated: new Date(),
            qnaSessionId: '456',
            userId: {
                _id: '789',
                userName: 'Sample User',
            },
            voters: [],
            toObject: function () {
                return this;
            },
        });

        const questions: IQuestionPopulatedUser[] = [question];

        const result = generateLeaderboard(
            questions,
            sampleUserAADObjId1,
            '456',
            false,
            false,
            'default'
        );

        const expected = <IAdaptiveCard>{
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.2',
            body: [
                {
                    type: 'TextBlock',
                    text: leaderboardStrings('allQuestions'),
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
                                            url: getPersonImage(
                                                question.userId.userName,
                                                question.userId._id
                                            ),
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
                                                    text:
                                                        question.userId
                                                            .userName,
                                                    weight: 'Bolder',
                                                },
                                                {
                                                    type: 'TextBlock',
                                                    text: question.content,
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
                                                    type: 'TextBlock',
                                                    text: ' ',
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
                                                    text: `${question.voters.length} `,
                                                    size: 'Medium',
                                                },
                                            ],
                                        },
                                    ],
                                    verticalContentAlignment: 'Center',
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        expect(result).toEqual(_adaptiveCard(expected));
    });

    test('upvoted question while QnA inactive', () => {
        const question = <IQuestionPopulatedUser>(<unknown>{
            _id: '123',
            content: "another user's question?",
            dateTimeCreated: new Date(),
            qnaSessionId: '456',
            userId: {
                _id: '789',
                userName: 'Sample User',
            },
            voters: [sampleUserAADObjId1],
            toObject: function () {
                return this;
            },
        });

        const questions: IQuestionPopulatedUser[] = [question];

        const result = generateLeaderboard(
            questions,
            sampleUserAADObjId1,
            '456',
            false,
            false,
            'default'
        );

        const expected = <IAdaptiveCard>{
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.2',
            body: [
                {
                    type: 'TextBlock',
                    text: leaderboardStrings('allQuestions'),
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
                                            url: getPersonImage(
                                                question.userId.userName,
                                                question.userId._id
                                            ),
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
                                                    text:
                                                        question.userId
                                                            .userName,
                                                    weight: 'Bolder',
                                                },
                                                {
                                                    type: 'TextBlock',
                                                    text: question.content,
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
                                                    type: 'TextBlock',
                                                    text: ' ',
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
                                                    text: `${question.voters.length} `,
                                                    size: 'Medium',
                                                    color: 'Accent',
                                                    weight: 'Bolder',
                                                },
                                            ],
                                        },
                                    ],
                                    verticalContentAlignment: 'Center',
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        expect(result).toEqual(_adaptiveCard(expected));
    });
});
