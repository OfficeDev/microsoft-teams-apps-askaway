export class Helper {
    constructor() {}

    /**
     * Get Locale Language Code
     * @param locale - Get teams locale and set it i18next
     */
    public setI18nextLocale(i18next, locale) {
        if (locale) {
            locale = locale.split('-');
            i18next.changeLanguage(locale[0].toLowerCase());
        }
    }

    public createEmptyActiveSessionData() {
        return {
            sessionId: '',
            title: '',
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
}
// tslint:disable-next-line:export-name
export default new Helper();
