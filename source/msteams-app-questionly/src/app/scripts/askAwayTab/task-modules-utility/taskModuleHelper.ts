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
import { TaskModuleMessages } from './taskModuleMessages';

/**
 * Handles a case where creating a QnA session fails from task module.
 * @param error - error occured while creating a QnA session.
 * @param endQnASessionHandler - handler to call when the task module is completed for `end session` flow.
 */
export const handleTaskModuleErrorForCreateQnASessionFlow = (error: any, endQnASessionHandler: () => void) => {
    let card: AdaptiveCard;

    if (error?.response?.data?.code === 'QnASessionLimitExhaustedError') {
        const submitHandler = (err: any, result: any) => {
            // If `end session` button is pressed, invoke end session callback.
            // Else, just close the task module.
            if (result?.id === SubmitButtonId.SubmitEndQnA) {
                handleEndQnASessionFlow(endQnASessionHandler);
            }
        };

        card = createCardForQnASessionLimitExhaustedError();
        invokeAdaptiveCardBasedTaskModule(TaskModuleMessages.StartQnATitle, card, submitHandler);

        return;
    } else if (error?.response?.data?.code === UnauthorizedAccessErrorCode.InsufficientPermissionsToCreateOrEndQnASession) {
        card = createCardForInsufficientPermissionsToCreateQnASessionError();
    } else if (error?.response?.status === StatusCodes.FORBIDDEN) {
        card = createCardForUnauthorizedAccessError();
    } else {
        card = createGenericErrorCard();
    }

    invokeAdaptiveCardBasedTaskModule(TaskModuleMessages.StartQnATitle, card);
};

/**
 * handles a case where ending a QnA session fails.
 * @param error - error occured while ending a QnA session.
 */
export const handleTaskModuleErrorForEndQnASessionFlow = (error: any) => {
    let card: AdaptiveCard;

    if (error?.response?.data?.code === UnauthorizedAccessErrorCode.InsufficientPermissionsToCreateOrEndQnASession) {
        card = createCardForInsufficientPermissionsToEndQnASessionError();
    } else if (error?.response?.status === StatusCodes.FORBIDDEN) {
        card = createCardForUnauthorizedAccessError();
    } else {
        card = createGenericErrorCard();
    }

    invokeAdaptiveCardBasedTaskModule(TaskModuleMessages.EndQnATitle, card);
};

/**
 * handles a case where new session creation is successful.
 */
export const handleTaskModuleResponseForSuccessfulCreateQnASessionFlow = () => {
    const card = createSuccessAdaptiveCard(TaskModuleMessages.NewSessionCreated);
    invokeAdaptiveCardBasedTaskModule(TaskModuleMessages.StartQnATitle, card);
};

/**
 * handles a case where a session is successfully ended.
 */
export const handleTaskModuleResponseForEndQnASessionFlow = () => {
    const card = createSuccessAdaptiveCard(TaskModuleMessages.UnblockedToCreateNewSession);
    invokeAdaptiveCardBasedTaskModule(TaskModuleMessages.EndQnATitle, card);
};

/**
 * Takes user through end session journey, prompts end qna session message and calls end session callback if necessary.
 * @param endSessionHandler - callback function in case user chooses to end the session.
 */
export const handleEndQnASessionFlow = (endSessionHandler: () => void) => {
    const submitHandler = (err: any, result: any) => {
        // If `end session` button is pressed, invoke end session callback.
        // Else, just close the task module.
        if (result?.id === SubmitButtonId.SubmitEndQnA) {
            endSessionHandler();
        }
    };

    const card = createEndQnAConfirmationAdaptiveCard();
    invokeAdaptiveCardBasedTaskModule(TaskModuleMessages.EndQnATitle, card, submitHandler);
};

/**
 * opens task module to create a new session.
 * @param submitHandler - Handler to call when the task module is completed.
 * @param locale - User's locale.
 * @param theme - Teams's theme.
 */
export const openStartQnASessionTaskModule = (submitHandler: (err: string, result: string) => void, locale: string, theme?: string) => {
    invokeIframeBasedTaskModule(TaskModuleMessages.StartQnATitle, `https://${process.env.HostName}/askAwayTab/createsession.html?theme=${theme}&locale=${locale}`, submitHandler);
};

/**
 * Allows an app to open the task module.
 * @param title - task module title.
 * @param url - The url to be rendered in the webview/iframe.
 * @param submitHandler - Handler to call when the task module is completed.
 */
export const invokeIframeBasedTaskModule = (title: string, url: string, submitHandler?: (err: string, result: string) => void) => {
    const taskInfo: TaskInfo = {
        url: url,
        title: title,
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
