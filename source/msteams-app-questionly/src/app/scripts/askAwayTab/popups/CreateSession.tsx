import { Provider } from '@fluentui/react-northstar';
import * as microsoftTeams from '@microsoft/teams-js';
import { SeverityLevel } from '@microsoft/applicationinsights-web';
import msteamsReactBaseComponent, { ITeamsBaseComponentState } from 'msteams-react-base-component';
import * as React from 'react';
import { trackTrace } from '../../telemetryService';
import Helper from '../shared/Helper';
import { i18next } from '../shared/i18next';
import './../index.scss';
import CreateSessionInternal from './CreateSessionInternal';

export interface CreateSessionProps {}
export interface CreateSessionState extends ITeamsBaseComponentState {
    theme: any;
    direction?: string;
}

export class CreateSession extends msteamsReactBaseComponent<CreateSessionProps, CreateSessionState> {
    constructor(props) {
        super(props);
        this.state = {
            theme: {},
        };
        microsoftTeams.initialize();
    }

    public async componentWillMount() {
        this.updateTheme(this.getQueryVariable('theme'));
        // Set Language for Localization
        microsoftTeams.getContext((context: microsoftTeams.Context) => {
            // Set Language for Localization
            Helper.setI18nextLocale(i18next, context.locale, (err) => {
                if (err) {
                    trackTrace(`Error occurred while setting the language and the error is: ${err.message}`, SeverityLevel.Error);
                } else {
                    this.setState({
                        direction: i18next.dir(),
                    });
                }
            });
        });
    }

    private handleSubmitCreateSession = (event) => {
        microsoftTeams.tasks.submitTask(event);
    };

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        return (
            <Provider rtl={this.state.direction == 'rtl'} theme={this.state.theme}>
                <CreateSessionInternal onSubmitCreateSession={this.handleSubmitCreateSession} />
            </Provider>
        );
    }
}
