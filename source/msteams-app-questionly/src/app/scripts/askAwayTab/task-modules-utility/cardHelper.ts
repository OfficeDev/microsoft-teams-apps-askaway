import { AdaptiveCard, IAdaptiveCard, SubmitAction } from 'adaptivecards';
import { ISubmitButtonData } from './ISubmitButtonData';

/**
 * Creates a submit button.
 * @param data - button metadata.
 * @returns - submit action button.
 */
export const createSubmitButton = (data: ISubmitButtonData): SubmitAction => {
    const submitAction = new SubmitAction();
    submitAction.title = data.title;
    submitAction.data = data;

    return submitAction;
};

/**
 * Makes an adaptive card template into an adaptive card object.
 * @param template - adaptive card template to parse
 */
export const _adaptiveCard = (template: IAdaptiveCard): AdaptiveCard => {
    // Parses the adaptive card template
    const adaptiveCard = new AdaptiveCard();
    adaptiveCard.parse(template);
    return adaptiveCard;
};
