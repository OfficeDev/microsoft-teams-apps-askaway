import { IAdaptiveCard } from 'adaptivecards';

/**
 * Adaptive Card form used to collect information to start the AMA.
 */
export default <IAdaptiveCard>{
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
                                    text: 'Title of AMA',
                                    wrap: true,
                                },
                                {
                                    type: 'Input.Text',
                                    id: 'title',
                                    value: '${title}',
                                    maxLength: 250,
                                    placeholder: 'Ex. Weekly Product AMA',
                                },
                                {
                                    type: 'TextBlock',
                                    text: 'Description of AMA',
                                    wrap: true,
                                },
                                {
                                    type: 'Input.Text',
                                    id: 'description',
                                    value: '${description}',
                                    maxLength: 250,
                                    placeholder:
                                        'Ex. Brighu is running a town hall. Ask your questions here!',
                                },
                                {
                                    type: 'TextBlock',
                                    text: 'Maximum number of characters: 250',
                                    spacing: 'Large',
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
            title: 'Submit',
        },
    ],
};

export const startAMAMetadata = {
    title: 'Questionly',
    height: 270,
    heightError: 285,
    width: 600,
};
