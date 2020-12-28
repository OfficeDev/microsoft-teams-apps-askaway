import i18next, { i18n } from "i18next";
import * as enStrings from "./resources/en.json";

// i18next module instance.
let i18n: i18n;

export const initLocalization = async (testStrings?: Strings) => {
  // Initiate localization if not done already.
  if (!i18n) {
    const config = {
      language: process.env.Language ? process.env.Language : "en",
      fallbackLanguage: process.env.FallbackLanguage
        ? process.env.FallbackLanguage
        : "en",
      defaultStrings: enStrings,
      debug: false,
    };

    let languageStrings = config.defaultStrings,
      fallbackLanguageStrings = config.defaultStrings;

    if (process.env.Language)
      // eslint-disable-next-line @typescript-eslint/tslint/config
      languageStrings = require(`./resources/${process.env.Language}.json`);

    if (process.env.FallbackLanguage)
      // eslint-disable-next-line @typescript-eslint/tslint/config
      fallbackLanguageStrings = require(`./resources/${process.env.FallbackLanguage}.json`);

    const resources = {
      [config.language]: {
        translation: languageStrings,
      },
    };

    if (config.fallbackLanguage !== config.language)
      resources[config.fallbackLanguage] = {
        translation: fallbackLanguageStrings,
      };

    if (testStrings) {
      resources["test"] = {
        translation: testStrings,
      };
    }

    i18n = i18next.createInstance({
      lng: config.language,
      fallbackLng: config.fallbackLanguage,
      debug: config.debug,
      resources,
      interpolation: { escapeValue: false },
    });

    await i18n.init();
  }
};

export interface Strings {
  mainCard: MainCard;
}

export interface MainCard {
  initiatedBy: string;
  topQuestions: string;
  upvotes: string;
  askQuestion: string;
  upvoteQuestions: string;
  viewQuestions: string;
  noQuestions: string;
  recentlyAskedAQuestion: string;
  recentlyAskedQuestions: string;
  sessionEndedNoMoreQuestions: string;
}

export const mainCardStrings = (
  string: keyof MainCard,
  options?: {
    [key: string]: any;
  }
) => {
  return i18n.t(`mainCard.${string}`, options);
};
