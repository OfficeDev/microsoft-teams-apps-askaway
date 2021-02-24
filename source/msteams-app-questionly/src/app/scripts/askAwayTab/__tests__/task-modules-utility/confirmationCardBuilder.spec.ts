import { SubmitAction, TextBlock } from 'adaptivecards';
import { confirmationCardBuilder } from '../../task-modules-utility/confirmationCardBuilder';

describe('test confirmationCardBuilder', () => {
    it('test confirmation card for end qna session flow', () => {
        const t = jest.fn();
        t.mockImplementation((key: string) => {
            return key;
        });

        const card = confirmationCardBuilder(t);

        expect(card.getItemAt(0) instanceof TextBlock).toBeTruthy();
        expect((<TextBlock>card.getItemAt(0)).text).toBe(`TaskModuleMessages.QnASessionEndPrompt`);

        expect((<SubmitAction>card.getActionAt(0)).title).toBe(`TaskModuleMessages.Cancel`);
        expect((<SubmitAction>card.getActionAt(1)).title).toBe(`TaskModuleMessages.EndSession`);
    });
});
