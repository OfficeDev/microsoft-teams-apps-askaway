import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import Adapter from 'enzyme-adapter-react-16';
import { Flex } from '@fluentui/react-northstar';
import { CreateSession } from '../popups/CreateSession';

configure({ adapter: new Adapter() });

describe('Create session', () => {
    it('should match the snapshot', () => {
        const wrapper = shallow(<CreateSession />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it.skip('should render TabContent', () => {
        const component = shallow(<CreateSession />);

        expect(component.find(Flex)).toHaveLength(2);
    });
});
