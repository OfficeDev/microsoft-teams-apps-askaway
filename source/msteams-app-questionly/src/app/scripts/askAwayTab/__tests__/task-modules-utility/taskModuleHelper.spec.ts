// tslint:disable:no-relative-imports
import { StatusCodes } from 'http-status-codes';
import { UnauthorizedAccessErrorCode } from '../../../../../errors/unauthorizedAccessError';
import {
    createCardForInsufficientPermissionsToCreateQnASessionError,
    createCardForInsufficientPermissionsToEndQnASessionError,
    createCardForQnASessionLimitExhaustedError,
    createCardForUnauthorizedAccessError,
    createGenericErrorCard,
} from '../../task-modules-utility/errorCardBuilder';
import { createSuccessAdaptiveCard } from '../../task-modules-utility/successCardBuilder';
import {
    handleTaskModuleErrorForCreateQnASessionFlow,
    handleTaskModuleErrorForEndQnASessionFlow,
    handleTaskModuleResponseForEndQnASessionFlow,
    handleTaskModuleResponseForSuccessfulCreateQnASessionFlow,
    invokeAdaptiveCardBasedTaskModule,
} from '../../task-modules-utility/taskModuleHelper';
import { TaskModuleMessages } from '../../task-modules-utility/taskModuleMessages';

describe('test handleTaskModuleErrorForCreateQnASessionFlow', () => {
    let testHandler: () => void;
    const t = jest.fn();

    beforeAll(() => {
        (<any>invokeAdaptiveCardBasedTaskModule) = jest.fn();

        // tslint:disable-next-line:no-empty-function
        testHandler = () => {
            return;
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('test handler for QnASessionLimitExhaustedError', () => {
        const error = {
            response: {
                data: {
                    code: 'QnASessionLimitExhaustedError',
                },
            },
        };

        handleTaskModuleErrorForCreateQnASessionFlow(t, error, testHandler);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(TaskModuleMessages.StartQnATitle, createCardForQnASessionLimitExhaustedError(), expect.anything());
    });

    it('test handler for InsufficientPermissionsToCreateOrEndQnASessionError', () => {
        const error = {
            response: {
                data: {
                    code: UnauthorizedAccessErrorCode.InsufficientPermissionsToCreateOrEndQnASession,
                },
            },
        };

        handleTaskModuleErrorForCreateQnASessionFlow(t, error, testHandler);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(TaskModuleMessages.StartQnATitle, createCardForInsufficientPermissionsToCreateQnASessionError());
    });

    it('test handler for UnauthorizedAccessError', () => {
        const error = {
            response: {
                status: StatusCodes.FORBIDDEN,
            },
        };

        handleTaskModuleErrorForCreateQnASessionFlow(t, error, testHandler);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(TaskModuleMessages.StartQnATitle, createCardForUnauthorizedAccessError());
    });

    it('test handler for generic error', () => {
        const error = {
            response: {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
            },
        };

        handleTaskModuleErrorForCreateQnASessionFlow(t, error, testHandler);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(TaskModuleMessages.StartQnATitle, createGenericErrorCard());
    });
});

describe('test handleTaskModuleErrorForEndQnASessionFlow', () => {
    const t = jest.fn();

    beforeAll(() => {
        (<any>invokeAdaptiveCardBasedTaskModule) = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('test handler for InsufficientPermissionsToCreateOrEndQnASessionError', () => {
        const error = {
            response: {
                data: {
                    code: UnauthorizedAccessErrorCode.InsufficientPermissionsToCreateOrEndQnASession,
                },
            },
        };

        handleTaskModuleErrorForEndQnASessionFlow(t, error);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(t, TaskModuleMessages.EndQnATitle, createCardForInsufficientPermissionsToEndQnASessionError());
    });

    it('test handler for UnauthorizedAccessError', () => {
        const error = {
            response: {
                status: StatusCodes.FORBIDDEN,
            },
        };

        handleTaskModuleErrorForEndQnASessionFlow(t, error);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(t, TaskModuleMessages.EndQnATitle, createCardForUnauthorizedAccessError());
    });

    it('test handler for generic error', () => {
        const error = {
            response: {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
            },
        };

        handleTaskModuleErrorForEndQnASessionFlow(t, error);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(t, TaskModuleMessages.EndQnATitle, createGenericErrorCard());
    });
});

describe('test handleTaskModuleResponseForSuccessfulCreateQnASessionFlow', () => {
    const t = jest.fn();

    beforeAll(() => {
        (<any>invokeAdaptiveCardBasedTaskModule) = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('test success card', () => {
        handleTaskModuleResponseForSuccessfulCreateQnASessionFlow(t);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(TaskModuleMessages.StartQnATitle, createSuccessAdaptiveCard(TaskModuleMessages.NewSessionCreated));
    });
});

describe('test handleTaskModuleResponseForEndQnASessionFlow', () => {
    const t = jest.fn();

    beforeAll(() => {
        (<any>invokeAdaptiveCardBasedTaskModule) = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('test success card', () => {
        handleTaskModuleResponseForEndQnASessionFlow(t);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(t, TaskModuleMessages.EndQnATitle, createSuccessAdaptiveCard(TaskModuleMessages.UnblockedToCreateNewSession));
    });
});
