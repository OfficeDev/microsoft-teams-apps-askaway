// tslint:disable-next-line:no-relative-imports
import './index.scss';
import * as React from 'react';
import {
    Provider,
    Flex,
    Text,
    Button,
    Form,
    Input,
    TextArea,
    FlexItem,
} from '@fluentui/react-northstar';
// tslint:disable-next-line:no-relative-imports
import * as microsoftTeams from '@microsoft/teams-js';
import msteamsReactBaseComponent, {
    ITeamsBaseComponentState,
} from 'msteams-react-base-component';
export interface CreateSessionProps {}
export interface CreateSessionState extends ITeamsBaseComponentState {
    theme: any;
    input: {
        title: string;
        description: string;
    };
    error: {
        isTitle: boolean;
        isDescription: boolean;
    };
}

export interface CreateSessionProps {}

export class CreateSession extends msteamsReactBaseComponent<
    CreateSessionProps,
    CreateSessionState
> {
    constructor(props) {
        super(props);
        this.state = {
            theme: {},
            input: {
                title: '',
                description: '',
            },
            error: {
                isTitle: false,
                isDescription: false,
            },
        };
        microsoftTeams.initialize();
    }

    public async componentWillMount() {
        this.updateTheme(this.getQueryVariable('theme'));
    }

    /**
     * Append the value to Input Fields
     * @param e - event
     * @param key - state key value
     */
    private appendInput = (e, key) => {
        const inputValues = this.state;
        inputValues.input[key] = e.target.value;
        this.setState(inputValues);
    };

    /**
     * Validate Create Sesion Form
     */
    private validateCreateSession(inputData) {
        const errorInput = this.state;
        errorInput['error']['isTitle'] = false;
        errorInput['error']['isDescription'] = false;
        if (!inputData['title']) {
            errorInput['error']['isTitle'] = true;
        }
        if (!inputData['description']) {
            errorInput['error']['isDescription'] = true;
        }
        this.setState(errorInput);
    }

    /**
     * Validate the input field
     * @param input
     * @param field
     */
    private validateCreateSessionField(input, field) {
        const errorInput = this.state;
        errorInput['error'][field] = true;
        if (input) {
            errorInput['error'][field] = false;
        }
        this.setState(errorInput);
    }

    private onSubmitCreateSession(e) {
        e.preventDefault();
        const inputData = this.state.input;
        this.validateCreateSession(inputData);
        if (inputData && inputData['title'] && inputData['description']) {
            microsoftTeams.tasks.submitTask(inputData);
        }
    }

    private showCreateSessionForm() {
        console.log('##############################\n\n');
        return (
            <Flex column>
                <Form
                    // tslint:disable-next-line:react-this-binding-issue
                    onSubmit={(e) => this.onSubmitCreateSession(e)}
                    className="sidepanel-form"
                    styles={{ display: 'flex', flexDirection: 'column' }}
                >
                    <div className="form-grid">
                        <Text content="Title Name*" size="small" />
                        <Input
                            label=""
                            as="div"
                            fluid
                            placeholder="Type a name"
                            styles={{ color: '#c8c6c4' }}
                            onKeyUp={(e) =>
                                this.validateCreateSessionField(
                                    this.state.input.title,
                                    'isTitle'
                                )
                            }
                            onChange={(e) => this.appendInput(e, 'title')}
                        />
                        {this.state.error.isTitle && (
                            <Text
                                styles={{ display: 'inline-flex' }}
                                error
                                content="Title is required*"
                                size="small"
                            />
                        )}
                    </div>
                    <div className="form-grid">
                        <Text content="Description*" size="small" />
                        <TextArea
                            fluid
                            styles={{ marginTop: '0.25rem' }}
                            placeholder="Type a description"
                            onKeyUp={(e) =>
                                this.validateCreateSessionField(
                                    this.state.input.description,
                                    'isDescription'
                                )
                            }
                            onChange={(e) => this.appendInput(e, 'description')}
                        />
                        {this.state.error.isDescription && (
                            <Text
                                styles={{ display: 'inline-flex' }}
                                error
                                content="Description is required*"
                                size="small"
                            />
                        )}
                    </div>
                    <div className="form-grid">
                        <Flex>
                            <FlexItem push>
                                <Button
                                    primary
                                    type="submit"
                                    className="btn-create-session"
                                    size="small"
                                >
                                    <Button.Content>Create</Button.Content>
                                </Button>
                            </FlexItem>
                        </Flex>
                    </div>
                </Form>
            </Flex>
        );
    }

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        return (
            <Provider theme={this.state.theme}>
                <React.Fragment>
                    <div style={{ padding: '1rem 2rem' }}>
                        {this.showCreateSessionForm()}
                    </div>
                </React.Fragment>
            </Provider>
        );
    }
}
