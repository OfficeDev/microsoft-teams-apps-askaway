import { Image, Text } from '@fluentui/react-northstar';
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import * as React from 'react';
import EmptyTile from '../../MeetingPanel/EmptyTile';

configure({ adapter: new enzymeAdapterReact16() });

describe('Test EmptyTile Component', () => {
    it('should render fine for two text lines', () => {
        const testImageSrc = 'testImageSrc';
        const line1 = 'line1';
        const line2 = 'line2';

        const wrapper = shallow(<EmptyTile image={testImageSrc} line1={line1} line2={line2} />);

        // Make sure image is present.
        expect(wrapper.find(Image)).toHaveLength(1);
        expect(wrapper.find(Image).at(0).props().src).toBe(testImageSrc);

        // Make sure both the text lines are rendered fine.
        expect(wrapper.find(Text)).toHaveLength(2);
        expect(wrapper.find(Text).at(0).props().content).toBe(line1);
        expect(wrapper.find(Text).at(1).props().content).toBe(line2);
    });

    it('should render fine for a single text line', () => {
        const testImageSrc = 'testImageSrc';
        const line1 = 'line1';

        const wrapper = shallow(<EmptyTile image={testImageSrc} line1={line1} />);

        // Make sure image is present.
        expect(wrapper.find(Image)).toHaveLength(1);
        expect(wrapper.find(Image).at(0).props().src).toBe(testImageSrc);

        // Make sure single text line is rendered.
        expect(wrapper.find(Text)).toHaveLength(1);
        expect(wrapper.find(Text).at(0).props().content).toBe(line1);
    });
});
