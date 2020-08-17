import * as strings from 'src/localization/resources/testLocale.json';

import {
    Strings,
    Errors,
    initLocalization,
    errorStrings,
    Generic,
    MainCard,
    StartQnA,
    EndQnA,
    Leaderboard,
    AskQuestion,
    askQuestionStrings,
    leaderboardStrings,
    endQnAStrings,
    startQnAStrings,
    mainCardStrings,
    genericStrings,
} from 'src/localization/locale';
import i18next from 'i18next';

const _stringFunctionsTest = (
    stringsObject:
        | Errors
        | Generic
        | MainCard
        | Leaderboard
        | AskQuestion
        | StartQnA
        | EndQnA,
    stringFunction
) => {
    Object.keys(stringsObject).forEach((key: keyof typeof stringsObject) => {
        expect(stringsObject[key]).toBeTruthy();
        expect(stringFunction(key)).toBe(stringsObject[key]);
    });
};

describe('generic tests', () => {
    let _testStrings: Strings;

    beforeAll(async () => {
        _testStrings = strings;
        // init localization
        await initLocalization(true, _testStrings);

        return;
    });

    it('error strings', () => {
        _stringFunctionsTest(_testStrings.errors, errorStrings);
    });

    it('generic strings', () => {
        _stringFunctionsTest(_testStrings.generic, genericStrings);
    });

    it('mainCard strings', () => {
        _stringFunctionsTest(_testStrings.mainCard, mainCardStrings);
    });

    it('startQnA strings', () => {
        _stringFunctionsTest(_testStrings.startQnA, startQnAStrings);
    });

    it('endQnA strings', () => {
        _stringFunctionsTest(_testStrings.endQnA, endQnAStrings);
    });

    it('leaderboard strings', () => {
        _stringFunctionsTest(_testStrings.leaderboard, leaderboardStrings);
    });

    it('askQuestion strings', () => {
        _stringFunctionsTest(_testStrings.askQuestion, askQuestionStrings);
    });
});

describe('importing new language', () => {
    let _testStrings: Strings;

    beforeAll(async () => {
        _testStrings = strings;
        process.env.Language = 'testLocale';
        process.env.FallbackLanguage = 'en';

        // init localization
        await initLocalization();

        expect(i18next.language).toBe('testLocale');
    });

    it('error strings', () => {
        _stringFunctionsTest(_testStrings.errors, errorStrings);
    });

    it('generic strings', () => {
        _stringFunctionsTest(_testStrings.generic, genericStrings);
    });

    it('mainCard strings', () => {
        _stringFunctionsTest(_testStrings.mainCard, mainCardStrings);
    });

    it('startQnA strings', () => {
        _stringFunctionsTest(_testStrings.startQnA, startQnAStrings);
    });

    it('endQnA strings', () => {
        _stringFunctionsTest(_testStrings.endQnA, endQnAStrings);
    });

    it('leaderboard strings', () => {
        _stringFunctionsTest(_testStrings.leaderboard, leaderboardStrings);
    });

    it('askQuestion strings', () => {
        _stringFunctionsTest(_testStrings.askQuestion, askQuestionStrings);
    });
});
