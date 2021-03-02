import { Container, Image, TextBlock, SubmitAction, ActionSet } from 'adaptivecards';
import {
    createCardForInsufficientPermissionsToCreateQnASessionError,
    createCardForInsufficientPermissionsToEndQnASessionError,
    createCardForQnASessionLimitExhaustedError,
    createCardForUnauthorizedAccessError,
    createGenericErrorCard,
} from '../../task-modules-utility/errorCardBuilder';

describe('test errorCardBuilder', () => {
    let t: jest.Mock<any, any>;

    beforeAll(() => {
        t = jest.fn();
        t.mockImplementation((key: string) => {
            return key;
        });
    });

    beforeAll(() => {
        Object.defineProperty(window, 'location', {
            value: {
                host: `${process.env.HostName}`,
            },
            writable: true,
        });
    });

    it('test generic error card', () => {
        const card = createGenericErrorCard(t);

        expect(card.getItemAt(0) instanceof Container).toBeTruthy();
        const container = <Container>card.getItemAt(0);
        expect(container.getItemAt(0) instanceof Image).toBeTruthy();
        expect(container.getItemAt(1) instanceof TextBlock).toBeTruthy();
        expect((<TextBlock>container.getItemAt(1)).text).toBe(`TaskModuleMessages.GenericErrorMessage`);
        expect(card.getActionAt(0) instanceof SubmitAction).toBeTruthy();
        expect((<SubmitAction>card.getActionAt(0)).title).toBe(`TaskModuleMessages.Ok`);
    });

    it('test error card for InsufficientPermissionsToCreateQnASessionError', () => {
        const card = createCardForInsufficientPermissionsToCreateQnASessionError(t);

        expect(card.getItemAt(0) instanceof Container).toBeTruthy();
        const container = <Container>card.getItemAt(0);
        expect(container.getItemAt(0) instanceof Image).toBeTruthy();
        expect(container.getItemAt(1) instanceof TextBlock).toBeTruthy();
        expect((<TextBlock>container.getItemAt(1)).text).toBe(`TaskModuleMessages.PermissionsToCreateQnASessionError`);
        expect(card.getActionAt(0) instanceof SubmitAction).toBeTruthy();
        expect((<SubmitAction>card.getActionAt(0)).title).toBe(`TaskModuleMessages.Ok`);
    });

    it('test error card for InsufficientPermissionsToEndQnASessionError', () => {
        const card = createCardForInsufficientPermissionsToEndQnASessionError(t);

        expect(card.getItemAt(0) instanceof Container).toBeTruthy();
        const container = <Container>card.getItemAt(0);
        expect(container.getItemAt(0) instanceof Image).toBeTruthy();
        expect(container.getItemAt(1) instanceof TextBlock).toBeTruthy();
        expect((<TextBlock>container.getItemAt(1)).text).toBe(`TaskModuleMessages.PermissionsToEndQnASessionError`);
        expect(card.getActionAt(0) instanceof SubmitAction).toBeTruthy();
        expect((<SubmitAction>card.getActionAt(0)).title).toBe(`TaskModuleMessages.Ok`);
    });

    it('test error card for QnASessionLimitExhaustedError', () => {
        const card = createCardForQnASessionLimitExhaustedError(t);

        expect(card.getItemAt(0) instanceof Container).toBeTruthy();
        const container = <Container>card.getItemAt(0);
        expect(container.getItemAt(0) instanceof Image).toBeTruthy();
        expect(container.getItemAt(1) instanceof TextBlock).toBeTruthy();
        expect((<TextBlock>container.getItemAt(1)).text).toBe(`TaskModuleMessages.QnASesssionAlreadyActive`);
        expect(container.getItemAt(2) instanceof TextBlock).toBeTruthy();
        expect((<TextBlock>container.getItemAt(2)).text).toBe(`TaskModuleMessages.EndQnASessionQuestion`);
        expect(card.getItemAt(1) instanceof Container).toBeTruthy();
        expect((<Container>card.getItemAt(1)).getItemCount()).toBe(1);

        const actionset = <ActionSet>(<Container>card.getItemAt(1)).getItemAt(0);

        expect((<SubmitAction>actionset.getActionAt(0)).title).toBe(`TaskModuleMessages.Cancel`);
        expect((<SubmitAction>actionset.getActionAt(1)).title).toBe(`TaskModuleMessages.EndSession`);
    });

    it('test error card for UnauthorizedAccessError', () => {
        const card = createCardForUnauthorizedAccessError(t);

        expect(card.getItemAt(0) instanceof Container).toBeTruthy();
        const container = <Container>card.getItemAt(0);
        expect(container.getItemAt(0) instanceof Image).toBeTruthy();
        expect(container.getItemAt(1) instanceof TextBlock).toBeTruthy();
        expect((<TextBlock>container.getItemAt(1)).text).toBe(`TaskModuleMessages.GenericUnauthorizedError`);
        expect(card.getActionAt(0) instanceof SubmitAction).toBeTruthy();
        expect((<SubmitAction>card.getActionAt(0)).title).toBe(`TaskModuleMessages.Ok`);
    });
});
