/**
 * @jest-environment jsdom
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import enzymeToJson from 'enzyme-to-json';
import * as React from 'react';
import { AskAwayTabConfig } from '../AskAwayTabConfig';
import AskAwayTabConfigInternal from '../AskAwayTabConfigInternal';

configure({ adapter: new enzymeAdapterReact16() });

describe('AskAwayTabConfig Component', () => {
    it('should match the snapshot', () => {
        const wrapper = shallow(<AskAwayTabConfig />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<AskAwayTabConfig />);
        expect(component.find(AskAwayTabConfigInternal)).toHaveLength(1);
    });
});
