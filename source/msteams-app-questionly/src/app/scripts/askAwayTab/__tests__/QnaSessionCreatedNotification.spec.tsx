import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import Adapter from 'enzyme-adapter-react-16';
import { QnaSessionCreatedNotification } from '../popups/QnaSessionCreatedNotification';
import QnaSessionNotificationInternal from '../popups/QnaSessionNotificationInternal';
import { i18next } from '../shared/i18next';

configure({ adapter: new Adapter() });

describe('QnaSessionCreatedNotification', () => {
    const t = jest.fn();
    const tReady = true;
    it('should match the snapshot', () => {
        const wrapper = shallow(<QnaSessionCreatedNotification t={t} tReady={tReady} i18n={i18next} />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render TabContent', () => {
        const component = shallow(<QnaSessionCreatedNotification t={t} tReady={tReady} i18n={i18next} />);
        component.setState({ theme: {} });
        expect(component.find(QnaSessionNotificationInternal)).toHaveLength(1);
    });
});
