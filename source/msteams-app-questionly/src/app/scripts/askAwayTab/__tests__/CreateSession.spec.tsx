// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @jest-environment jsdom
 */

import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import enzymeToJson from 'enzyme-to-json';
import * as React from 'react';
import { CreateSession } from '../popups/CreateSession';
import CreateSessionInternal from '../popups/CreateSessionInternal';

configure({ adapter: new enzymeAdapterReact16() });

describe('Create session', () => {
    it('should match the snapshot', () => {
        const wrapper = shallow(<CreateSession />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render TabContent', () => {
        const component = shallow(<CreateSession />);
        expect(component.find(CreateSessionInternal)).toHaveLength(1);
    });
});
