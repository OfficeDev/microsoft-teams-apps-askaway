import { StatusCodes } from 'http-status-codes';
import { UnauthorizedAccessErrorCode } from '../../../../../errors/unauthorizedAccessError';
import {
    createCardForInsufficientPermissionsToCreateQnASessionError,
    createCardForInsufficientPermissionsToEndQnASessionError,
    createCardForQnASessionLimitExhaustedError,
    createCardForUnauthorizedAccessError,
    createGenericErrorCard,
} from '../../task-modules-utility/errorCardBuilder';
import { successCardBuilder } from '../../task-modules-utility/successCardBuilder';
import {
    handleTaskModuleErrorForCreateQnASessionFlow,
    handleTaskModuleErrorForEndQnASessionFlow,
    handleTaskModuleResponseForEndQnASessionFlow,
    handleTaskModuleResponseForSuccessfulCreateQnASessionFlow,
    invokeAdaptiveCardBasedTaskModule,
} from '../../task-modules-utility/taskModuleHelper';

describe('test handleTaskModuleErrorForCreateQnASessionFlow', () => {
    let testHandler: () => void;
    let t: jest.Mock<any, any>;

    beforeAll(() => {
        t = jest.fn();
        t.mockImplementation((key: string) => {
            return key;
        });
    });

    beforeAll(() => {
        (<any>invokeAdaptiveCardBasedTaskModule) = jest.fn();

        // tslint:disable-next-line:no-empty-function
        testHandler = () => {
            return;
        };
    });

    beforeAll(() => {
        Object.defineProperty(window, 'location', {
            value: {
                host: `${process.env.HostName}`,
            },
            writable: true,
        });
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
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(`TaskModuleMessages.StartQnATitle`, createCardForQnASessionLimitExhaustedError(t), expect.anything());
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
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(`TaskModuleMessages.StartQnATitle`, createCardForInsufficientPermissionsToCreateQnASessionError(t));
    });

    it('test handler for UnauthorizedAccessError', () => {
        const error = {
            response: {
                status: StatusCodes.FORBIDDEN,
            },
        };

        handleTaskModuleErrorForCreateQnASessionFlow(t, error, testHandler);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(`TaskModuleMessages.StartQnATitle`, createCardForUnauthorizedAccessError(t));
    });

    it('test handler for generic error', () => {
        const error = {
            response: {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
            },
        };

        handleTaskModuleErrorForCreateQnASessionFlow(t, error, testHandler);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(`TaskModuleMessages.StartQnATitle`, createGenericErrorCard(t));
    });
});

describe('test handleTaskModuleErrorForEndQnASessionFlow', () => {
    let t: jest.Mock<any, any>;

    beforeAll(() => {
        t = jest.fn();
        t.mockImplementation((key: string) => {
            return key;
        });
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
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(`TaskModuleMessages.EndQnATitle`, createCardForInsufficientPermissionsToEndQnASessionError(t));
    });

    it('test handler for UnauthorizedAccessError', () => {
        const error = {
            response: {
                status: StatusCodes.FORBIDDEN,
            },
        };

        handleTaskModuleErrorForEndQnASessionFlow(t, error);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(`TaskModuleMessages.EndQnATitle`, createCardForUnauthorizedAccessError(t));
    });

    it('test handler for generic error', () => {
        const error = {
            response: {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
            },
        };

        handleTaskModuleErrorForEndQnASessionFlow(t, error);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(`TaskModuleMessages.EndQnATitle`, createGenericErrorCard(t));
    });
});

describe('test handleTaskModuleResponseForSuccessfulCreateQnASessionFlow', () => {
    let t: jest.Mock<any, any>;

    beforeAll(() => {
        t = jest.fn();
        t.mockImplementation((key: string) => {
            return key;
        });
        (<any>invokeAdaptiveCardBasedTaskModule) = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('test success card', () => {
        handleTaskModuleResponseForSuccessfulCreateQnASessionFlow(t);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(`TaskModuleMessages.StartQnATitle`, successCardBuilder(`TaskModuleMessages.NewSessionCreated`));
    });
});

describe('test handleTaskModuleResponseForEndQnASessionFlow', () => {
    let t: jest.Mock<any, any>;

    beforeAll(() => {
        t = jest.fn();
        t.mockImplementation((key: string) => {
            return key;
        });
        (<any>invokeAdaptiveCardBasedTaskModule) = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('test success card', () => {
        handleTaskModuleResponseForEndQnASessionFlow(t);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledTimes(1);
        expect(invokeAdaptiveCardBasedTaskModule).toBeCalledWith(`TaskModuleMessages.EndQnATitle`, successCardBuilder(`TaskModuleMessages.UnblockedToCreateNewSession`));
    });
});
