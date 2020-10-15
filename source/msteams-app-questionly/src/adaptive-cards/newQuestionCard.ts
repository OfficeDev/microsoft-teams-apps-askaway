import { IAdaptiveCard } from 'adaptivecards';
import {
    askQuestionStrings,
    genericStrings,
    errorStrings,
} from 'src/localization/locale';

/**
 * Defines the template for the adaptive card used when creating a new question.
 */
export const newQuestionCard = () =>
    <IAdaptiveCard>{
        version: '1.0.0',
        $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                text: errorStrings('submittingQuestions'),
                color: 'attention',
                $when: '${question != null}',
            },
            {
                type: 'TextBlock',
                text: `${askQuestionStrings(
                    'textFieldLabel'
                )} (250 ${genericStrings('maxCharacters')})`,
            },
            {
                type: 'Input.Text',
                id: 'usertext',
                placeholder: askQuestionStrings('textFieldExample'),
                maxLength: 250,
                isMultiline: true,
                value: '${if(question != null, question, null)}',
            },
        ],
        actions: [
            {
                id: 'submitQuestion',
                type: 'Action.Submit',
                title: genericStrings('submit'),
                data: {
                    id: 'submitQuestion',
                    qnaSessionId: '${qnaId}',
                },
            },
        ],
    };
