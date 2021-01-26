// tslint:disable:no-relative-imports
import { DataEventHandlerFactory } from '../../dataEventHandling/dataEventHandlerFactory';
import { NewQuestionAddedEventHandler } from '../../dataEventHandling/newQuestionAddedEventHandler';
import { QnaSessionCreatedEventHandler } from '../../dataEventHandling/qnaSessionCreatedEventHandler';
import { QnaSessionEndedEventHandler } from '../../dataEventHandling/qnaSessionEndedEventHandler';
import { QuestionDownvotedEventHandler } from '../../dataEventHandling/QuestionDownvotedEventHandler';
import { QuestionMarkedAsAnsweredEventHandler } from '../../dataEventHandling/questionMarkedAsAnsweredEventHandler';
import { QuestionUpvotedEventHandler } from '../../dataEventHandling/questionUpvotedEventHandler';

describe('validates DataEventHandlerFactory createHandler method', () => {
    const dataEventHandlerFactory = new DataEventHandlerFactory();

    it('get handler for qnaSessionCreatedEvent', async () => {
        const result = dataEventHandlerFactory.createHandler('qnaSessionCreatedEvent');
        expect(result?.constructor.name).toEqual(QnaSessionCreatedEventHandler.name);
    });

    it('get handler for newQuestionAddedEvent', async () => {
        const result = dataEventHandlerFactory.createHandler('newQuestionAddedEvent');
        expect(result?.constructor.name).toEqual(NewQuestionAddedEventHandler.name);
    });

    it('get handler for questionUpvotedEvent', async () => {
        const result = dataEventHandlerFactory.createHandler('questionUpvotedEvent');
        expect(result?.constructor.name).toEqual(QuestionUpvotedEventHandler.name);
    });

    it('get handler for questionDownvotedEvent', async () => {
        const result = dataEventHandlerFactory.createHandler('questionDownvotedEvent');
        expect(result?.constructor.name).toEqual(QuestionDownvotedEventHandler.name);
    });

    it('get handler for questionMarkedAsAnsweredEvent', async () => {
        const result = dataEventHandlerFactory.createHandler('questionMarkedAsAnsweredEvent');
        expect(result?.constructor.name).toEqual(QuestionMarkedAsAnsweredEventHandler.name);
    });

    it('get handler for qnaSessionEndedEvent', async () => {
        const result = dataEventHandlerFactory.createHandler('qnaSessionEndedEvent');
        expect(result?.constructor.name).toEqual(QnaSessionEndedEventHandler.name);
    });

    it('get handler for unsupportedEvent', async () => {
        const result = dataEventHandlerFactory.createHandler('unsupportedEvent');
        expect(result).not.toBeDefined();
    });
});
