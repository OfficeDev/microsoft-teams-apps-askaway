import { Provider } from '@fluentui/react-northstar';
import * as microsoftTeams from '@microsoft/teams-js';
import msteamsReactBaseComponent, { ITeamsBaseComponentState } from 'msteams-react-base-component';
import * as React from 'react';
import Helper from '../shared/Helper';
import { i18next } from '../shared/i18next';
import './../index.scss';
import CreateSessionInternal from './CreateSessionInternal';

export interface CreateSessionProps {}
export interface CreateSessionState extends ITeamsBaseComponentState {
    theme: any;
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
        if (this.getQueryVariable('locale')) {
            Helper.setI18nextLocale(i18next, this.getQueryVariable('locale'));
        }
    }

    private handleSubmitCreateSession = (event) => {
        microsoftTeams.tasks.submitTask(event);
    };

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        return (
            <Provider theme={this.state.theme}>
                <CreateSessionInternal onSubmitCreateSession={this.handleSubmitCreateSession} />
            </Provider>
        );
    }
}
