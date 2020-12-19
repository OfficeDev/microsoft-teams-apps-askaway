import * as React from 'react';
import { shallow, configure, mount } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import Adapter from 'enzyme-adapter-react-16';
import { CreateSession } from '../CreateSession';
import { Flex } from '@fluentui/react-northstar';

configure({ adapter: new Adapter() });

describe('Create session', () => {
    it('should match the snapshot', () => {
        const wrapper = shallow(<CreateSession />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    // Component Test Sample
    it('should render TabContent', () => {
        const component = shallow(<CreateSession />);

        expect(component.find(Flex)).toHaveLength(2);
    });
});
