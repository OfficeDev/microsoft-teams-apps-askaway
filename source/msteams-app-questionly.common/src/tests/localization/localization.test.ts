import * as strings from "src/localization/resources/testLocale.json";
import {
  initLocalization,
  MainCard,
  mainCardStrings,
  Strings,
} from "src/localization/locale";

const _stringFunctionsTest = (stringsObject: MainCard, stringFunction) => {
  Object.keys(stringsObject).forEach((key) => {
    expect(stringsObject[key]).toBeTruthy();
    expect(stringFunction(key)).toBe(stringsObject[key]);
  });
};

describe("generic tests", () => {
  let _testStrings: Strings;

  beforeAll(async () => {
    _testStrings = strings;

    process.env.Language = "testLocale";
    process.env.FallbackLanguage = "en";

    // init localization
    await initLocalization(_testStrings);
  });

  it("maincard strings", () => {
    _stringFunctionsTest(_testStrings.mainCard, mainCardStrings);
  });
});
