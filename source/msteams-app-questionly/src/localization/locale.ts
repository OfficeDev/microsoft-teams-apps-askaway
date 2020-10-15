import i18next from 'i18next';
import * as enStrings from 'src/localization/resources/en.json';
import { exceptionLogger } from 'src/util/ExceptionTracking';

export interface Strings {
    mainCard: MainCard;
    leaderboard: Leaderboard;
    startQnA: StartQnA;
    endQnA: EndQnA;
    askQuestion: AskQuestion;
    errors: Errors;
    generic: Generic;
}

export interface AskQuestion {
    textFieldExample: string;
    taskModuleTitle: string;
    resubmitTaskModuleTitle: string;
    textFieldLabel: string;
}

export interface EndQnA {
    taskModuleTitle: string;
    prompt: string;
}

export interface Errors {
    upvoting: string;
    submittingQuestions: string;
    missingFields: string;
    taskFetch: string;
    taskSubmit: string;
    leaderboard: string;
    conversationInvalid: string;
}

export interface Generic {
    submit: string;
    preview: string;
    cancel: string;
    endSession: string;
    maxCharacters: string;
    noQuestions: string;
}

export interface Leaderboard {
    taskModuleTitle: string;
    yourQuestions: string;
    allQuestions: string;
    noQuestions: string;
    refresh: string;
}

export interface MainCard {
    updated: string;
    initiatedBy: string;
    endedBy: string;
    topQuestions: string;
    showRecentQuestions: string;
    upvotes: string;
    askQuestion: string;
    upvoteQuestions: string;
    viewQuestions: string;
    noMoreQuestions: string;
    noQuestions: string;
    recentlyAskedAQuestion: string;
    recentlyAskedQuestions: string;
    and: string;
    totalQuestions: string;
}

export interface StartQnA {
    titleFieldLabel: string;
    titleFieldExample: string;
    descriptionFieldLabel: string;
    descriptionFieldExample: string;
    taskModuleTitle: string;
    taskModuleTitleEdit: string;
}

export const initLocalization = async (
    testing = false,
    testStrings?: Strings
) => {
    const config = {
        language: process.env.Language ? process.env.Language : 'en',
        fallbackLanguage: process.env.FallbackLanguage
            ? process.env.FallbackLanguage
            : 'en',
        defaultStrings: enStrings,
        debug: false,
    };

    let languageStrings = config.defaultStrings,
        fallbackLanguageStrings = config.defaultStrings;
    try {
        if (process.env.Language)
            // eslint-disable-next-line @typescript-eslint/tslint/config
            languageStrings = require(`./resources/${process.env.Language}.json`);

        if (process.env.FallbackLanguage)
            // eslint-disable-next-line @typescript-eslint/tslint/config
            fallbackLanguageStrings = require(`./resources/${process.env.FallbackLanguage}.json`);
    } catch (error) {
        if (!testing) exceptionLogger(error);
    }

    const resources = {
        [config.language]: {
            translation: languageStrings,
        },
    };

    if (config.fallbackLanguage !== config.language)
        resources[config.fallbackLanguage] = {
            translation: fallbackLanguageStrings,
        };
    if (testStrings)
        resources['test'] = {
            translation: testStrings,
        };

    // Setup localization
    return i18next.init({
        lng: testStrings ? 'test' : config.language,
        fallbackLng: config.fallbackLanguage,
        debug: config.debug,
        resources,
    });
};

export const mainCardStrings = (string: keyof MainCard) => {
    return i18next.t(`mainCard.${string}`);
};

export const leaderboardStrings = (string: keyof Leaderboard) => {
    return i18next.t(`leaderboard.${string}`);
};

export const startQnAStrings = (string: keyof StartQnA) => {
    return i18next.t(`startQnA.${string}`);
};

export const endQnAStrings = (string: keyof EndQnA) => {
    return i18next.t(`endQnA.${string}`);
};

export const askQuestionStrings = (string: keyof AskQuestion) => {
    return i18next.t(`askQuestion.${string}`);
};

export const genericStrings = (string: keyof Generic) => {
    return i18next.t(`generic.${string}`);
};

export const errorStrings = (string: keyof Errors) => {
    return i18next.t(`errors.${string}`);
};
