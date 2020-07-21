import { IAdaptiveCard } from 'adaptivecards';

/**
 * Adaptive Card form used to collect information to start the AMA.
 */
export default () =>
    <IAdaptiveCard>{
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.2',
        body: [
            {
                type: 'ColumnSet',
                columns: [
                    {
                        type: 'Column',
                        width: 2,
                        items: [
                            {
                                type: 'Container',
                                items: [
                                    {
                                        type: 'TextBlock',
                                        text: '${errorMessage}',
                                        color: 'Attention',
                                    },
                                    {
                                        type: 'TextBlock',
                                        text: 'Title of Q & A*',
                                        wrap: true,
                                    },
                                    {
                                        type: 'Input.Text',
                                        id: 'title',
                                        value: '${title}',
                                        maxLength: 250,
                                    },
                                    {
                                        type: 'TextBlock',
                                        text: 'Message* (250 characters max)',
                                        wrap: true,
                                    },
                                    {
                                        type: 'Input.Text',
                                        id: 'description',
                                        value: '${description}',
                                        maxLength: 250,
                                        placeholder:
                                            'Ex. Please submit and upvote quesions for the CEO!',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
        actions: [
            {
                id: 'submit',
                type: 'Action.Submit',
                title: 'Preview',
            },
        ],
    };
