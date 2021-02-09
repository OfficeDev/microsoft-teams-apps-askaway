/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { ThemePrepared } from '@fluentui/react-northstar';
import Adapter from 'enzyme-adapter-react-16';
import { TabQuestions } from '../../TabContent/TabQuestions';
import { Helper } from '../../shared/Helper';

configure({ adapter: new Adapter() });

describe('TabQuestions Component', () => {
    const onClickAction = jest.fn();
    const activeSessionData = new Helper().createEmptyActiveSessionData();
    const theme = {} as ThemePrepared;
    const t = jest.fn();

    it('should match the snapshot', () => {
        const wrapper = shallow(<TabQuestions t={t} theme={theme} activeSessionData={activeSessionData} onClickAction={onClickAction} teamsTabContext={{ entityId: '', locale: '' }} />);

        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<TabQuestions t={t} theme={theme} activeSessionData={activeSessionData} onClickAction={onClickAction} teamsTabContext={{ entityId: '', locale: '' }} />);
        console.log(component.debug());

        expect(component.find('div.question-container')).toBeTruthy();
    });
});
