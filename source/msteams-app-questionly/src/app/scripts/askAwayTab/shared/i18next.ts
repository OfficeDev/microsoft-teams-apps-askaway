import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
// import moment from 'moment';
// import 'moment/min/locales.min';

// export const defaultLocale = () => {
//     return 'en-US';
// }

i18next
    .use(Backend)
    .use(initReactI18next)
    .init({
        // resources: { en: enUsJson },
        lng: 'en',
        fallbackLng: 'en',
        debug: false,
        defaultNS: 'translation',
        ns: 'translation',
        keySeparator: '.',
        react: {
            useSuspense: false,
        },
        interpolation: {
            escapeValue: false,
            formatSeparator: ',',
        },
    });

// export const updateLocale = () => {
//     const search = window.location.search;
//     const params = new URLSearchParams(search);
//     const locale = params.get("locale") || defaultLocale();
//     i18next.changeLanguage(locale);
//     moment.locale(locale);
// };
export default i18next;
