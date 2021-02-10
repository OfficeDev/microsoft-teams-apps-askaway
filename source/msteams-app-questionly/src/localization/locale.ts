import i18next from 'i18next';
import enJson from 'src/localization/resources/en.json';
import { exceptionLogger } from 'src/util/exceptionTracking';

export interface Strings {
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
    qnasessionlimitexhaustedError: string;
    qnasessionCreationError: string;
    insufficientPermissionsToCreateOrEndQnASessionError: string;
    unableToPostCardForSessionStartedEvent: string;
    unableToPerformActivityOnEndedSession: string;
}

export interface Generic {
    submit: string;
    preview: string;
    cancel: string;
    endSession: string;
    noQuestions: string;
}

export interface Leaderboard {
    taskModuleTitle: string;
    yourQuestions: string;
    allQuestions: string;
    noQuestions: string;
    refresh: string;
}

export interface StartQnA {
    titleFieldLabel: string;
    titleFieldExample: string;
    descriptionFieldLabel: string;
    descriptionFieldExample: string;
    taskModuleTitle: string;
    taskModuleTitleEdit: string;
}

export const initLocalization = async (testing = false, testStrings?: Strings) => {
    const config = {
        language: process.env.Language ? process.env.Language : 'en',
        fallbackLanguage: process.env.FallbackLanguage ? process.env.FallbackLanguage : 'en',
        defaultStrings: enJson,
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
    await i18next.init({
        lng: testStrings ? 'test' : config.language,
        fallbackLng: config.fallbackLanguage,
        debug: config.debug,
        resources,
    });
};

export const leaderboardStrings = (string: keyof Leaderboard) => {
    return i18next.t(`leaderboard.${string}`);
};

export const startQnAStrings = (
    string: keyof StartQnA,
    options?: {
        [key: string]: any;
    }
) => {
    return i18next.t(`startQnA.${string}`, options);
};

export const endQnAStrings = (string: keyof EndQnA) => {
    return i18next.t(`endQnA.${string}`);
};

export const askQuestionStrings = (
    string: keyof AskQuestion,
    options?: {
        [key: string]: any;
    }
) => {
    return i18next.t(`askQuestion.${string}`, options);
};

export const genericStrings = (string: keyof Generic) => {
    return i18next.t(`generic.${string}`);
};

export const errorStrings = (string: keyof Errors) => {
    return i18next.t(`errors.${string}`);
};
