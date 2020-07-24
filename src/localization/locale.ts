import i18next from 'i18next';
import * as enStrings from './en.json';

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
    myQuestions: string;
    allQuestions: string;
    noQuestions: string;
}

export interface MainCard {
    updated: string;
    initiatedBy: string;
    endedBy: string;
    topQuestions: string;
    showRecentQuestions: string;
    recentQuestions: string;
    upvotes: string;
    askQuestion: string;
    upvoteQuestions: string;
    noMoreQuestions: string;
    noQuestions: string;
}

export interface StartQnA {
    titleFieldLabel: string;
    titleFieldExample: string;
    descriptionFieldLabel: string;
    descriptionFieldExample: string;
    taskModuleTitle: string;
    taskModuleTitleEdit: string;
}

export const initLocalization = async (testStrings?: Strings) => {
    const config = {
        language: process.env.Language ? process.env.Language : 'en',
        fallbackLanguage: process.env.FallbackLanguage
            ? process.env.FallbackLanguage
            : 'en',
        defaultStrings: enStrings,
        debug: false,
    };

    const languageStrings = process.env.Language
        ? require(`./${process.env.Language}.json`)
        : require(`./en.json`);

    const fallbackLanguageStrings = process.env.FallbackLanguage
        ? require(`./${process.env.FallbackLanguage}.json`)
        : require(`./en.json`);

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
