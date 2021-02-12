// tslint:disable:no-relative-imports
import { TaskInfo, tasks } from '@microsoft/teams-js';
import { AdaptiveCard } from 'adaptivecards';
import { StatusCodes } from 'http-status-codes';
import { UnauthorizedAccessErrorCode } from '../../../../errors/unauthorizedAccessError';
import { createEndQnAConfirmationAdaptiveCard } from './confirmationCardBuilder';
import {
    createGenericErrorCard,
    createCardForInsufficientPermissionsToCreateQnASessionError,
    createCardForInsufficientPermissionsToEndQnASessionError,
    createCardForQnASessionLimitExhaustedError,
    createCardForUnauthorizedAccessError,
} from './errorCardBuilder';
import { SubmitButtonId } from './ISubmitButtonData';
import { createSuccessAdaptiveCard } from './successCardBuilder';
import { TFunction } from 'i18next';

/**
 * Handles a case where creating a QnA session fails from task module.
 * @param t - TFunction for localization.
 * @param error - error occured while creating a QnA session.
 * @param endQnASessionHandler - handler to call when the task module is completed for `end session` flow.
 */
export const handleTaskModuleErrorForCreateQnASessionFlow = (t: TFunction, error: any, endQnASessionHandler: () => void) => {
    let card: AdaptiveCard;

    if (error?.response?.data?.code === 'QnASessionLimitExhaustedError') {
        const submitHandler = (err: any, result: any) => {
            // If `end session` button is pressed, invoke end session callback.
            // Else, just close the task module.
            if (result?.id === SubmitButtonId.SubmitEndQnA) {
                handleEndQnASessionFlow(t, endQnASessionHandler);
            }
        };

        card = createCardForQnASessionLimitExhaustedError(t);
        invokeAdaptiveCardBasedTaskModule(t('TaskModuleMessages.StartQnATitle'), card, submitHandler);

        return;
    } else if (error?.response?.data?.code === UnauthorizedAccessErrorCode.InsufficientPermissionsToCreateOrEndQnASession) {
        card = createCardForInsufficientPermissionsToCreateQnASessionError(t);
    } else if (error?.response?.status === StatusCodes.FORBIDDEN) {
        card = createCardForUnauthorizedAccessError(t);
    } else {
        card = createGenericErrorCard(t);
    }

    invokeAdaptiveCardBasedTaskModule(t('TaskModuleMessages.StartQnATitle'), card);
};

/**
 * handles a case where ending a QnA session fails.
 * @param t - TFunction for localization.
 * @param error - error occured while ending a QnA session.
 */
export const handleTaskModuleErrorForEndQnASessionFlow = (t: TFunction, error: any) => {
    let card: AdaptiveCard;

    if (error?.response?.data?.code === UnauthorizedAccessErrorCode.InsufficientPermissionsToCreateOrEndQnASession) {
        card = createCardForInsufficientPermissionsToEndQnASessionError(t);
    } else if (error?.response?.status === StatusCodes.FORBIDDEN) {
        card = createCardForUnauthorizedAccessError(t);
    } else {
        card = createGenericErrorCard(t);
    }

    invokeAdaptiveCardBasedTaskModule(t('TaskModuleMessages.EndQnATitle'), card);
};

/**
 * @param t - TFunction for localization.
 * handles a case where new session creation is successful.
 */
export const handleTaskModuleResponseForSuccessfulCreateQnASessionFlow = (t: TFunction) => {
    const card = createSuccessAdaptiveCard(t('TaskModuleMessages.NewSessionCreated'));
    invokeAdaptiveCardBasedTaskModule(t('TaskModuleMessages.StartQnATitle'), card);
};

/**
 * @param t - TFunction for localization.
 * handles a case where a session is successfully ended.
 */
export const handleTaskModuleResponseForEndQnASessionFlow = (t: TFunction) => {
    const card = createSuccessAdaptiveCard(t('TaskModuleMessages.UnblockedToCreateNewSession'));
    invokeAdaptiveCardBasedTaskModule(t('TaskModuleMessages.EndQnATitle'), card);
};

/**
 * Takes user through end session journey, prompts end qna session message and calls end session callback if necessary.
 * @param t - TFunction for localization.
 * @param endSessionHandler - callback function in case user chooses to end the session.
 */
export const handleEndQnASessionFlow = (t: TFunction, endSessionHandler: () => void) => {
    const submitHandler = (err: any, result: any) => {
        // If `end session` button is pressed, invoke end session callback.
        // Else, just close the task module.
        if (result?.id === SubmitButtonId.SubmitEndQnA) {
            endSessionHandler();
        }
    };

    const card = createEndQnAConfirmationAdaptiveCard(t);
    invokeAdaptiveCardBasedTaskModule(t('TaskModuleMessages.EndQnATitle'), card, submitHandler);
};

/**
 * opens task module to create a new session.
 * @param t - TFunction to localize strings.
 * @param submitHandler - Handler to call when the task module is completed.
 * @param locale - User's locale.
 * @param theme - Teams's theme.
 */
export const openStartQnASessionTaskModule = (t: TFunction, submitHandler: (err: string, result: string) => void, locale: string, theme?: string) => {
    invokeIframeBasedTaskModule(t('TaskModuleMessages.StartQnATitle'), `https://${window.location.hostname}/askAwayTab/createsession.html?theme=${theme}&locale=${locale}`, submitHandler);
};

/**
 * Opens task module to switch sessions.
 * @param t - TFunction to localize strings.
 * @param submitHandler - Handler to call when the task module is completed.
 * @param conversationId - conversation id.
 * @param preSelectedSessionId - session id which should be preselected in switch tab.
 * @param theme - Teams's theme.
 */
export const openSwitchSessionsTaskModule = (t: TFunction, submitHandler: (err: string, result: string) => void, conversationId?: string, preSelectedSessionId?: string, theme?: string) => {
    const swicthSessionTaskModuleUrl = `https://${window.location.hostname}/askAwayTab/switchSession.html?conversationId=${conversationId}&selectedSessionId=${preSelectedSessionId}&theme=${theme}`;
    invokeIframeBasedTaskModule(t('TaskModuleMessages.SwitchSessionTitle'), swicthSessionTaskModuleUrl, submitHandler, 600, 600);
};

/**
 * Allows an app to open the task module.
 * @param title - task module title.
 * @param url - The url to be rendered in the webview/iframe.
 * @param submitHandler - Handler to call when the task module is completed.
 * @param height - The requested height of the iframe.
 * @param width - The requested width of the iframe.
 */
export const invokeIframeBasedTaskModule = (title: string, url: string, submitHandler?: (err: string, result: string) => void, height?: number, width?: number) => {
    const taskInfo: TaskInfo = {
        url: url,
        title: title,
        height: height,
        width: width,
    };

    tasks.startTask(taskInfo, submitHandler);
};

/**
 * Allows an app to open the task module.
 * @param title - task module title.
 * @param card - adaptive card.
 * @param submitHandler - Handler to call when the task module is completed.
 */
export const invokeAdaptiveCardBasedTaskModule = (title: string, card: AdaptiveCard, submitHandler?: (err: string, result: string) => void) => {
    const taskInfo: TaskInfo = {
        card: card.toJSON(),
        title: title,
    };

    tasks.startTask(taskInfo, submitHandler);
};

/**
 * Invokes task module with generic error when updating question fails.
 * @param t - TFunction to localize strings.
 */
export const invokeTaskModuleForQuestionUpdateFailure = (t: TFunction) => {
    const card = createGenericErrorCard(t);
    invokeAdaptiveCardBasedTaskModule(t('popups.updateQuestionFailedTitle'), card);
};

/**
 * Invokes task module with generic error when posting question fails.
 * @param t - TFunction to localize strings.
 */
export const invokeTaskModuleForQuestionPostFailure = (t: TFunction) => {
    const card = createGenericErrorCard(t);
    invokeAdaptiveCardBasedTaskModule(t('popups.postQuestionFailedTitle'), card);
};

/**
 * Invokes task module with generic error for any failure.
 * @param t - TFunction to localize strings.
 */
export const invokeTaskModuleForGenericError = (t: TFunction) => {
    const card = createGenericErrorCard(t);
    invokeAdaptiveCardBasedTaskModule(t('popups.genericFailureTitle'), card);
};
