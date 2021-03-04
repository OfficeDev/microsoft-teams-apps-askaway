import { Button, Text, ThemePrepared } from '@fluentui/react-northstar';
import { configure, shallow } from 'enzyme';
import enzymeAdapterReact16 from 'enzyme-adapter-react-16';
import * as React from 'react';
import { Trans } from 'react-i18next';
import { ConnectionStatusAlert } from '../../signalR/ConnectionStatusAlert';

configure({ adapter: new enzymeAdapterReact16() });

describe('Test ConnectionStatusAlert Component', () => {
    let onRefreshConnection;
    let t: jest.Mock<any, any>;

    beforeAll(() => {
        t = jest.fn();
        onRefreshConnection = jest.fn();
        t.mockImplementation((key: string) => {
            return key;
        });
    });

    // Creates dummy color schemes for unit tests
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
        expect(wrapper.find(Trans)).toHaveLength(1);

        // Make sure dismiss action is present.
        expect(wrapper.find(Button)).toHaveLength(1);
    });
});
