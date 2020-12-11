import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
// tslint:disable-next-line:no-relative-imports
// import * as enUsJson from 'src/app/scripts/askAwayTab/localization/en-us.json';
const enUsJson = require('./../localization/en-us/en-us.json');
i18next.use(initReactI18next).init({
    resources: { en: enUsJson },
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    keySeparator: '.',
    interpolation: {
        escapeValue: false,
        formatSeparator: ',',
    },
});
export default i18next;
