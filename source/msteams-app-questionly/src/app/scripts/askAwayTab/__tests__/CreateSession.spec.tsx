import * as React from 'react';
import { shallow, configure } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import { CreateSession } from '../popups/CreateSession';
import CreateSessionInternal from '../popups/CreateSessionInternal';

configure({ adapter: new enzymeAdapterReact16() });

describe('Create session', () => {
    it('should match the snapshot', () => {
        const wrapper = shallow(<CreateSession />);
        expect(enzymeToJson(wrapper)).toMatchSnapshot();
    });

    it.skip('should render TabContent', () => {
        const component = shallow(<CreateSession />);

        expect(component.find(CreateSessionInternal)).toHaveLength(1);
    });
});
