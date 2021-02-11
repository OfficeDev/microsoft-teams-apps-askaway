// tslint:disable:no-relative-imports
import { ActionSet, AdaptiveCard, TextBlock, TextWeight, TextSize, Container, VerticalAlignment, HorizontalAlignment, IAdaptiveCard } from 'adaptivecards';
import { createSubmitButton, _adaptiveCard } from './cardHelper';
import { SubmitButtonId } from './ISubmitButtonData';
import * as ACData from 'adaptivecards-templating';
import { TFunction } from 'i18next';

/**
 * Creates adaptive card for generic errors.
 * @returns - adaptive card.
 */
export const createGenericErrorCard = (t: TFunction): AdaptiveCard => {
    const card = createBaseErrorAdaptiveCard([t('TaskModuleMessages.GenericErrorMessage')]);
    card.addAction(createSubmitButton({ title: t('TaskModuleMessages.Ok'), id: SubmitButtonId.Ok }));

    return card;
};

/**
 * Creates card for the scenario where QnA session creation fails as user is not a presenter/organizer.
 * @returns - adaptive card.
 */
export const createCardForInsufficientPermissionsToCreateQnASessionError = (t: TFunction): AdaptiveCard => {
    const card = createBaseErrorAdaptiveCard([t('TaskModuleMessages.PermissionsToCreateQnASessionError'), t('TaskModuleMessages.AskQuestions'), t('TaskModuleMessages.PleaseDo')]);
    card.addAction(createSubmitButton({ title: t('TaskModuleMessages.Ok'), id: SubmitButtonId.Ok }));

    return card;
};

/**
 * Creates card for the scenario where end QnA session action fails as user is not a presenter/organizer.
 * @returns - adaptive card.
 */
export const createCardForInsufficientPermissionsToEndQnASessionError = (t: TFunction): AdaptiveCard => {
    const card = createBaseErrorAdaptiveCard([t('TaskModuleMessages.PermissionsToEndQnASessionError')]);
    card.addAction(createSubmitButton({ title: t('TaskModuleMessages.Ok'), id: SubmitButtonId.Ok }));

    return card;
};

/**
 * Creates card for the scenario where QnA session creation fails as there is an active session already exists.
 * @returns - adaptive card.
 */
export const createCardForQnASessionLimitExhaustedError = (t: TFunction): AdaptiveCard => {
    const card = createBaseErrorAdaptiveCard([t('TaskModuleMessages.QnASesssionAlreadyActive'), t('TaskModuleMessages.EndQnASessionQuestion')]);

    // Center aligned CTAs.
    const container = new Container();
    container.minPixelHeight = 150;
    container.horizontalAlignment = HorizontalAlignment.Center;
    container.verticalContentAlignment = VerticalAlignment.Center;
    const actionSet = new ActionSet();
    actionSet.horizontalAlignment = HorizontalAlignment.Center;
    actionSet.addAction(createSubmitButton({ title: t('TaskModuleMessages.Cancel'), id: SubmitButtonId.Cancel }));
    actionSet.addAction(createSubmitButton({ title: t('TaskModuleMessages.EndSession'), id: SubmitButtonId.SubmitEndQnA }));

    container.addItem(actionSet);
    card.addItem(container);

    return card;
};

/**
 * Creates card for the scenario where QnA session creation/end fails due to authorization error.
 * @returns - adaptive card.
 */
export const createCardForUnauthorizedAccessError = (t: TFunction): AdaptiveCard => {
    const card = createBaseErrorAdaptiveCard([t('TaskModuleMessages.GenericUnauthorizedError')]);
    card.addAction(createSubmitButton({ title: t('TaskModuleMessages.Ok'), id: SubmitButtonId.Ok }));

    return card;
};

/**
 * Creates error message text block.
 * @param errorMessage - message to be displayed.
 * @returns - text block element.
 */
const createTextBlockElement = (errorMessage: string): TextBlock => {
    const textBlock = new TextBlock();
    textBlock.horizontalAlignment = HorizontalAlignment.Center;
    textBlock.weight = TextWeight.Bolder;
    textBlock.size = TextSize.Large;
    textBlock.text = errorMessage;
    textBlock.wrap = true;

    return textBlock;
};

/**
 * Base error card template.
 */
const baseErrorCard = () =>
    <IAdaptiveCard>{
        $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.2',
        body: [
            {
                type: 'Container',
                minPixelHeight: 150,
                verticalContentAlignment: 'center',
                items: [
                    {
                        type: 'Image',
                        url: '${errorImageUrl}',
                        width: '160px',
                        horizontalAlignment: 'center',
                    },
                ],
            },
        ],
    };

/**
 * Creates base error card with appropriate image.
 * @param errorMessages - error messages to be shown in error card.
 * @returns - adaptive card.
 */
const createBaseErrorAdaptiveCard = (errorMessages: string[]): AdaptiveCard => {
    const errorImageUrl = `https://${process.env.HostName}/images/failure_image.png`;
    const template = new ACData.Template(baseErrorCard()).expand({
        $root: {
            errorImageUrl,
        },
    });

    const card = _adaptiveCard(template);
    const container = <Container>card.getItemAt(0);
    errorMessages.forEach((message) => {
        container.addItem(createTextBlockElement(message));
    });

    return card;
};
