// tslint:disable:no-relative-imports
import { Container, Image, TextBlock } from 'adaptivecards';
import { createSuccessAdaptiveCard } from '../../task-modules-utility/successCardBuilder';

describe('test errorCardBuilder', () => {
    it('test success card', () => {
        const testSuccessMessage = 'testSuccessMessage';
        const card = createSuccessAdaptiveCard(testSuccessMessage);

        expect(card.getItemAt(0) instanceof Container).toBeTruthy();
        const container = <Container>card.getItemAt(0);
        expect(container.getItemAt(0) instanceof Image).toBeTruthy();
        expect(container.getItemAt(1) instanceof TextBlock).toBeTruthy();

        expect((<TextBlock>container.getItemAt(1)).text).toBe(testSuccessMessage);
    });
});
