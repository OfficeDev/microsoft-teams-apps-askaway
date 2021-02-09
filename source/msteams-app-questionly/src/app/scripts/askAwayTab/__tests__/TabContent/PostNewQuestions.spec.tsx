/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Flex, Text, Card, ThemePrepared } from '@fluentui/react-northstar';
import Adapter from 'enzyme-adapter-react-16';
import { PostNewQuestions } from '../../TabContent/PostNewQuestions';
import { Helper } from '../../shared/Helper';
import Badge from '../../shared/Badge';

configure({ adapter: new Adapter() });

describe('PostNewQuestions Component', () => {
    const activeSessionData = new Helper().createEmptyActiveSessionData();
    const onPostNewQuestion = jest.fn();
    const t = jest.fn();
    const theme = {} as ThemePrepared;

    it('should match the snapshot', () => {
        const wrapper = shallow(<PostNewQuestions t={t} theme={theme} activeSessionData={activeSessionData} onPostNewQuestion={onPostNewQuestion} />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<PostNewQuestions t={t} theme={theme} activeSessionData={activeSessionData} onPostNewQuestion={onPostNewQuestion} />);

        expect(component.find(Flex)).toHaveLength(3);
        expect(component.find(Text)).toHaveLength(2);
        expect(component.find(Card)).toHaveLength(1);
        expect(component.find(Badge)).toHaveLength(1);
    });
});
