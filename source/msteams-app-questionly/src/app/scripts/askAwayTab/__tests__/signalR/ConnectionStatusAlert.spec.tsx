import { shallow, configure } from 'enzyme';
import * as React from 'react';
import Adapter from 'enzyme-adapter-react-16';
import { Text, Button, ThemePrepared } from '@fluentui/react-northstar';
import { ConnectionStatusAlert } from '../../signalR/ConnectionStatusAlert';

configure({ adapter: new Adapter() });

describe('Test ConnectionStatusAlert Component', () => {
    const onRefreshConnection = jest.fn();
    let t: jest.Mock<any, any>;

    beforeAll(() => {
        t = jest.fn();
        t.mockImplementation((key: string, obj: any) => {
            return obj?.RefreshLink || key;
        });
    });

    /** Creates dummy color schemes for unit tests */
    const createThemeForUTs = (): ThemePrepared => {
        return ({
            siteVariables: {
                colorScheme: {
                    default: {
                        foregroundDisabled1: '',
                        border: '',
                    },
                    green: {
                        background: '',
                        foreground1: '',
                    },
                },
            },
        } as unknown) as ThemePrepared;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render connection status text with refresh now button', () => {
        const wrapper = shallow(<ConnectionStatusAlert t={t} theme={createThemeForUTs()} onRefreshConnection={onRefreshConnection} />);

        // Make sure connection status text is present.
        expect(wrapper.find(Text)).toHaveLength(1);

        // Make sure `refresh now` link is present.
        expect(wrapper.find('a.refreshNowLink')).toHaveLength(1);

        // Make sure dismiss action is present.
        expect(wrapper.find(Button)).toHaveLength(1);
    });

    it('should call `onRefreshConnection` callback on refresh now link', () => {
        const wrapper = shallow(<ConnectionStatusAlert t={t} theme={createThemeForUTs()} onRefreshConnection={onRefreshConnection} />);

        // Click on close button.
        wrapper.find('a.refreshNowLink').simulate('click', { preventDefault: () => {} });
        wrapper.update();

        // Make sure connection status text is not present.
        expect(wrapper.find(Text)).toHaveLength(1);

        // Make sure `refresh now` link is not present.
        expect(wrapper.find('a.refreshNowLink')).toHaveLength(1);

        // Make sure dismiss action is not present.
        expect(wrapper.find(Button)).toHaveLength(1);

        // Make sure callback is called.
        expect(onRefreshConnection).toBeCalledTimes(1);
    });
});
