import { Container, Image, TextBlock } from 'adaptivecards';
import { successCardBuilder } from '../../task-modules-utility/successCardBuilder';

describe('test errorCardBuilder', () => {
    beforeAll(() => {
        Object.defineProperty(window, 'location', {
            value: {
                host: `${process.env.HostName}`,
            },
            writable: true,
        });
    });

    it('test success card', () => {
        const testSuccessMessage = 'testSuccessMessage';
        const card = successCardBuilder(testSuccessMessage);
        expect(card.getItemAt(0) instanceof Container).toBeTruthy();
        const container = <Container>card.getItemAt(0);
        expect(container.getItemAt(0) instanceof Image).toBeTruthy();
        expect(container.getItemAt(1) instanceof TextBlock).toBeTruthy();

        expect((<TextBlock>container.getItemAt(1)).text).toBe(testSuccessMessage);
    });
});
