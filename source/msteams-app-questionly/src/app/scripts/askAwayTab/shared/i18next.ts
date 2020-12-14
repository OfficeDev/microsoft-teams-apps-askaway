import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
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
export default i18next;
