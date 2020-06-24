// All the functions to populate the adaptive cards should go in here
import { AdaptiveCard } from 'adaptivecards';
import newQuestionCardTemplate from './NewQuestion';
import newQuestionErrorCardTemplate from './NewQuestionError';
import * as ACData from 'adaptivecards-templating';

/**
 * Creates and parses the adaptive card for creating a new question.
 * @returns Adaptive Card associated with creating a new question
 */
export const getNewQuestionCard = (amaSessionId: string): AdaptiveCard => {
    const template = new ACData.Template(newQuestionCardTemplate).expand({
        $root: {
            AMA_ID: amaSessionId,
        },
    });
    return _adaptiveCard(template);
};

/**
 * Creates and parses the adaptive card for errors when creating a new question.
 * @returns Adaptive Card associated with errors from creating a new question
 */
export const getQuestionErrorCard = (): AdaptiveCard => {
    const adaptiveCard = new AdaptiveCard();
    adaptiveCard.parse(newQuestionErrorCardTemplate);
    return adaptiveCard;
};

const _adaptiveCard = (template: any): AdaptiveCard => {
    // Parses the adaptive card template
    const adaptiveCard = new AdaptiveCard();
    adaptiveCard.parse(template);
    return adaptiveCard;
};
