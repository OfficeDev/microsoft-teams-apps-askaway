import { IDataEventHandler } from './IDataEventHandler';
import { NewQuestionAddedEventHandler } from './newQuestionAddedEventHandler';
import { QnaSessionCreatedEventHandler } from './qnaSessionCreatedEventHandler';
import { QnaSessionEndedEventHandler } from './qnaSessionEndedEventHandler';
import { QuestionDownvotedEventHandler } from './QuestionDownvotedEventHandler';
import { QuestionMarkedAsAnsweredEventHandler } from './questionMarkedAsAnsweredEventHandler';
import { QuestionUpvotedEventHandler } from './questionUpvotedEventHandler';

/**
 * Factory to create data event handlers.
 */
export class DataEventHandlerFactory {
    public createHandler = (eventType: string): IDataEventHandler | undefined => {
        switch (eventType) {
            case 'qnaSessionCreatedEvent': {
                return new QnaSessionCreatedEventHandler();
            }
            case 'newQuestionAddedEvent': {
                return new NewQuestionAddedEventHandler();
            }
            case 'questionUpvotedEvent': {
                return new QuestionUpvotedEventHandler();
            }
            case 'questionDownvotedEvent': {
                return new QuestionDownvotedEventHandler();
            }
            case 'questionMarkedAsAnsweredEvent': {
                return new QuestionMarkedAsAnsweredEventHandler();
            }
            case 'qnaSessionEndedEvent': {
                return new QnaSessionEndedEventHandler();
            }
        }

        return undefined;
    };
}
