import { Flex } from '@fluentui/react-northstar';
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import enzymeToJson from 'enzyme-to-json';
import * as React from 'react';
import { CreateSession } from '../popups/CreateSession';

configure({ adapter: new enzymeAdapterReact16() });

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
