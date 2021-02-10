// tslint:disable:no-relative-imports
import { AdaptiveCard, IAdaptiveCard } from 'adaptivecards';
import { _adaptiveCard } from './cardHelper';
import { ISubmitButtonData, SubmitButtonId } from './ISubmitButtonData';
import * as ACData from 'adaptivecards-templating';
import { TFunction } from 'i18next';

/**
 * Creates a card for end Q&A session end confirmation.
 */
export const createEndQnAConfirmationAdaptiveCard = (t: TFunction): AdaptiveCard => {
    return createConfirmationAdaptiveCard(
        t('TaskModuleMessages.QnASessionEndPrompt'),
        { title: t('TaskModuleMessages.Cancel'), id: SubmitButtonId.Cancel },
        { title: t('TaskModuleMessages.EndSession'), id: SubmitButtonId.SubmitEndQnA }
    );
};

/**
 * Base confirmation card template.
 */
const baseConfirmationCard = () =>
    <IAdaptiveCard>{
        $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.2',
        body: [
            {
                type: 'TextBlock',
                text: '${prompt}',
            },
        ],
        actions: [
            {
                id: 'cancelEndQnA',
                type: 'Action.Submit',
                title: '${dismissTitle}',
                data: '${dismissActionData}',
            },
            {
                id: 'cancelEndQnA',
                type: 'Action.Submit',
                title: '${submitTitle}',
                data: '${confirmActionData}',
            },
        ],
    };

/**
 * Creates adaptive card for confirmation scenarios.
 * @param prompt - Confirmation question.
 * @param dismissAction - Dismiss action metadata.
 * @param confirmAction - Confirm action metadata.
 */
const createConfirmationAdaptiveCard = (prompt: string, dismissActionData: ISubmitButtonData, confirmActionData: ISubmitButtonData): AdaptiveCard => {
    const dismissTitle = dismissActionData.title;
    const submitTitle = confirmActionData.title;

    const template = new ACData.Template(baseConfirmationCard()).expand({
        $root: {
            prompt,
            dismissTitle,
            dismissActionData,
            submitTitle,
            confirmActionData,
        },
    });

    return _adaptiveCard(template);
};
