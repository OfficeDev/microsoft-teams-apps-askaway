/**
 * @jest-environment jsdom
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import { QnaSessionCreatedNotification } from '../popups/QnaSessionCreatedNotification';
import QnaSessionNotificationInternal from '../popups/QnaSessionNotificationInternal';

configure({ adapter: new enzymeAdapterReact16() });

describe('QnaSessionCreatedNotification', () => {
    let url = '';
    beforeAll(() => {
        global.window = Object.create(window);
        url = 'https://dummy.com';
        Object.defineProperty(window, 'location', {
            value: {
                href: url,
            },
        });
    });

    it('should match the snapshot', () => {
        const wrapper = shallow(<QnaSessionCreatedNotification />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render QnaSessionCreatedNotification', () => {
        const component = shallow(<QnaSessionCreatedNotification />);
        component.setState({ theme: {}, direction: 'ltr' });
        expect(component.find(QnaSessionNotificationInternal)).toHaveLength(1);
    });
});
