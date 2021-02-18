// tslint:disable:no-relative-imports
import './../index.scss';
import * as React from 'react';
import { Flex, Text, Image } from '@fluentui/react-northstar';

/**
 * Properties of empty tile component
 */
export interface EmptyTileProps {
    /**
     * Image src.
     */
    image: string;
    /**
     * Text to be rendered below image.
     */
    line1: string;
    /**
     * Another line of text.
     */
    line2?: string;
}

/**
 * Tile with image and texts.
 */
const EmptyTile: React.FunctionComponent<EmptyTileProps> = (props) => {
    return (
        <React.Fragment>
            <Image alt="image" src={props.image} />
            <Flex.Item align="center">
                <div className="text-caption-panel">
                    <Text size="small" content={props.line1} />
                    {props.line2 && <Text size="small" content={props.line2} />}
                </div>
            </Flex.Item>
        </React.Fragment>
    );
};
export default EmptyTile;
