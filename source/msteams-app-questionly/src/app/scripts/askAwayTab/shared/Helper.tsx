let moment = require('moment');

export class Helper {
    constructor() {}

    /**
     * Get Locale Language Code
     * @param locale - Get teams locale and set it i18next
     */
    public setI18nextLocale(i18next, locale, callback?) {
        if (locale) {
            locale = locale.split('-');
            i18next.changeLanguage(locale[0].toLowerCase(), (err) => {
                // Callback function will be called once i18next sets the current language.
                if (err) {
                    console.log('Error occurred while setting the language', err.message);
                }
                if (callback) {
                    callback();
                }
            });
        }
    }

    public createEmptyActiveSessionData() {
        return {
            sessionId: '',
            title: '',
            description: '',
            isActive: false,
            dateTimeCreated: new Date(),
            hostUser: {
                id: '',
                name: '',
            },
            answeredQuestions: [],
            unansweredQuestions: [],
        };
    }

    public createDateString(date: Date): string {
        return moment(date).format('L');
    }
}
// tslint:disable-next-line:export-name
export default new Helper();
