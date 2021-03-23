/**
 * @jest-environment jsdom
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Menu } from '@fluentui/react-northstar';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import TabHeader from '../../MeetingPanel/TabHeader';

configure({ adapter: new enzymeAdapterReact16() });

describe('AskAwayTabRemove Component', () => {
    let t;
    const tabActiveIndex = 1;
    let onSelectActiveTab;

    beforeAll(() => {
        t = jest.fn();
        onSelectActiveTab = jest.fn();
    });

    it('should match the snapshot', () => {
        const wrapper = shallow(<TabHeader t={t} tabActiveIndex={tabActiveIndex} onSelectActiveTab={onSelectActiveTab} />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<TabHeader t={t} tabActiveIndex={tabActiveIndex} onSelectActiveTab={onSelectActiveTab} />);

        expect(component.find(Menu)).toBeTruthy();
    });
});
