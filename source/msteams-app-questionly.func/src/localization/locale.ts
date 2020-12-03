import i18next from "i18next";
import * as enStrings from "./resources/en.json";

export const initLocalization = () => {
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

  // Setup localization
  return i18next.init({
    lng: config.language,
    fallbackLng: config.fallbackLanguage,
    debug: config.debug,
    resources,
  });
};

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

export const mainCardStrings = (string: keyof MainCard) => {
  return i18next.t(`mainCard.${string}`);
};
