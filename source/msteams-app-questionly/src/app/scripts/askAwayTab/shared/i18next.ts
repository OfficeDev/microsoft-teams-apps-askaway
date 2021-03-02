import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import i18nextHttpBackend from 'i18next-http-backend';

i18next
    .use(i18nextHttpBackend)
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

export { i18next };
