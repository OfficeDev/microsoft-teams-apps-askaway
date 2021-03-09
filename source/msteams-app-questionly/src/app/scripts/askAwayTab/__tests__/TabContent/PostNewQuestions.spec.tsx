/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { Flex, Text, Card, ThemePrepared } from '@fluentui/react-northstar';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import { PostNewQuestions } from '../../TabContent/PostNewQuestions';
import { Helper } from '../../shared/Helper';
import Badge from '../../shared/Badge';
import { themeMock } from '../mocks/themes';

configure({ adapter: new enzymeAdapterReact16() });

describe('PostNewQuestions Component', () => {
    let activeSessionData;
    let onPostNewQuestion;
    let t;
    let theme;
    let testUserName;

    beforeAll(() => {
        t = jest.fn();
        activeSessionData = new Helper().createEmptyActiveSessionData();
        onPostNewQuestion = jest.fn();
        theme = themeMock;
        testUserName = '1234';
    });

    it('should match the snapshot', () => {
        const wrapper = shallow(<PostNewQuestions t={t} theme={theme} activeSessionData={activeSessionData} onPostNewQuestion={onPostNewQuestion} userName={testUserName} />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it('should render the tab', () => {
        const component = shallow(<PostNewQuestions t={t} theme={theme} activeSessionData={activeSessionData} onPostNewQuestion={onPostNewQuestion} userName={testUserName} />);

        expect(component.find(Flex)).toHaveLength(3);
        expect(component.find(Text)).toHaveLength(3);
        expect(component.find(Card)).toHaveLength(1);
        expect(component.find(Badge)).toHaveLength(1);
    });
});
