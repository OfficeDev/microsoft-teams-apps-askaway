import { AdaptiveCard, IAdaptiveCard } from 'adaptivecards';
import * as ACData from 'adaptivecards-templating';
import { _adaptiveCard } from './cardHelper';

/**
 * Base success card template.
 */
const baseSuccessCard = () =>
    <IAdaptiveCard>{
        $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.2',
        body: [
            {
                type: 'Container',
                minPixelHeight: 150,
                verticalContentAlignment: 'center',
                items: [
                    {
                        type: 'Image',
                        url: '${successImageUrl}',
                        horizontalAlignment: 'center',
                    },
                    {
                        type: 'TextBlock',
                        text: '${successMessage}',
                        horizontalAlignment: 'center',
                    },
                ],
            },
        ],
    };

/**
 * Creates adaptive card for success scenarios.
 * @param successMessage - success message to be shown in card.
 */
export const createSuccessAdaptiveCard = (successMessage: string): AdaptiveCard => {
    const successImageUrl = `https://${process.env.HostName}/images/success_image.png`;
    const template = new ACData.Template(baseSuccessCard()).expand({
        $root: {
            successImageUrl,
            successMessage,
        },
    });

    return _adaptiveCard(template);
};
