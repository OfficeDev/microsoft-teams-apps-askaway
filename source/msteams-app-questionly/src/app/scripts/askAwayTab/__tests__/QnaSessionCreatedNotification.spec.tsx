import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import Adapter from 'enzyme-adapter-react-16';
import { QnaSessionCreatedNotification } from '../popups/QnaSessionCreatedNotification';
import QnaSessionNotificationInternal from '../popups/QnaSessionNotificationInternal';

configure({ adapter: new Adapter() });

describe('QnaSessionCreatedNotification', () => {
    it('should match the snapshot', () => {
        const wrapper = shallow(<QnaSessionCreatedNotification />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render TabContent', () => {
        const component = shallow(<QnaSessionCreatedNotification />);
        component.setState({ theme: {} });
        expect(component.find(QnaSessionNotificationInternal)).toHaveLength(1);
    });
});
