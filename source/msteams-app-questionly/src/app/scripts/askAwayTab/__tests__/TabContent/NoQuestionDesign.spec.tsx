/**
 * @jest-environment jsdom
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Flex, Image, Text } from '@fluentui/react-northstar';
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import enzymeToJson from 'enzyme-to-json';
import * as React from 'react';
import NoQuestionDesign from '../../TabContent/NoQuestionDesign';

configure({ adapter: new enzymeAdapterReact16() });

describe('NoQuestionDesign Component', () => {
    let t;
    beforeAll(() => {
        t = jest.fn();
    });

    it('should match the snapshot', () => {
        const wrapper = shallow(<NoQuestionDesign t={t} isSessionActive={true} />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<NoQuestionDesign t={t} isSessionActive={true} />);

        expect(component.find(Flex)).toHaveLength(1);
        expect(component.find(Image)).toHaveLength(1);
        expect(component.find(Text)).toHaveLength(1);
    });
});
