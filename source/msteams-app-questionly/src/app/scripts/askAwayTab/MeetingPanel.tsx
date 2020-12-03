// tslint:disable-next-line:no-relative-imports
import './index.scss';
import * as React from 'react';
// tslint:disable-next-line:no-relative-imports
import HttpService from './shared/HttpService';
import {
    Flex,
    Text,
    Button,
    Image,
    Form,
    Input,
    TextArea,
    FlexItem,
    SendIcon,
} from '@fluentui/react-northstar';

export interface MeetingPanelProps {
    teamsData: any;
}

export interface MeetingPanelState {
    activeSessionData: any;
    input: {
        title: string;
        description: string;
    };
    error: {
        isTitle: boolean;
        isDescription: boolean;
    };
}

export class MeetingPanel extends React.Component<
    MeetingPanelProps,
    MeetingPanelState
> {
    constructor(props) {
        super(props);
        this.state = {
            activeSessionData: null,
            input: {
                title: '',
                description: '',
            },
            error: {
                isTitle: false,
                isDescription: false,
            },
        };
    }

    componentDidMount() {
        this.getActiveSession();
    }

    /**
     * To Identify Active Session
     */
    private getActiveSession() {
        HttpService.get(
            `/conversations/${this.props.teamsData.chatId}/sessions`
        )
            .then((response: any) => {
                if (response && response.data && response.data.length > 0) {
                    this.setState({
                        activeSessionData: response.data[0],
                    });
                }
            })
            .catch((error) => {});
    }

    /**
     * on submit create a new session
     * @param e
     */
    private onSubmitCreateSession(e) {
        e.preventDefault();
        const inputData = this.state.input;
        this.validateCreateSession(inputData);
        if (inputData && inputData['title'] && inputData['description']) {
            const createSessionData = {
                title: inputData['title'],
                description: inputData['description'],
                scopeId: this.props.teamsData.chatId,
                // hostUserId: '',
                isChannel: false,
            };
            HttpService.post(
                `/conversations/${this.props.teamsData.chatId}/sessions`,
                createSessionData
            )
                .then((response: any) => {
                    if (
                        response &&
                        response['data'] &&
                        response['data']['qnaSessionId']
                    ) {
                        this.setState({
                            activeSessionData: response.data,
                        });
                    }
                })
                .catch((error) => {});
        }
    }

    /**
     * Append the value to Input Fields
     * @param e
     * @param key
     */
    private appendInput = (e, key) => {
        const i = this.state;
        i.input[key] = e.target.value;
        this.setState(i);
    };

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

    private showCreateSessionForm() {
        return (
            <Flex column>
                <Text
                    styles={{
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#ffffff',
                    }}
                    content="Create a new session"
                    size="medium"
                />
                <Form
                    // tslint:disable-next-line:react-this-binding-issue
                    onSubmit={(e) => this.onSubmitCreateSession(e)}
                    className="sidepanel-form"
                    styles={{ display: 'flex', flexDirection: 'column' }}
                >
                    <div className="form-grid">
                        <Text content="Title" size="small" />
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
                        <Text content="Description" size="small" />
                        <TextArea
                            styles={{ color: '#c8c6c4' }}
                            fluid
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
                        <FlexItem push>
                            <Button
                                type="submit"
                                className="btn-create-session"
                                size="small"
                            >
                                <Button.Content>
                                    Create a new session
                                </Button.Content>
                            </Button>
                        </FlexItem>
                    </div>
                </Form>
            </Flex>
        );
    }

    private postQuestions() {
        const sessionTitle = this.state.input.title
            ? this.state.input.title
            : this.state.activeSessionData.title;
        return (
            <Flex hAlign="center" vAlign="center">
                <Text
                    align="start"
                    styles={{
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#ffffff',
                    }}
                    content={sessionTitle}
                    size="medium"
                />
                <div className="no-question">
                    <Image
                        className="create-session"
                        alt="image"
                        styles={{ width: '17rem' }}
                        src={require('./../../web/assets/create_session.png')}
                    />
                    <Flex.Item align="center">
                        <Text
                            className="text-caption-panel"
                            content="Welcome! No questions posted yet. Type a question to start!"
                        />
                    </Flex.Item>
                </div>
                <div
                    style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        width: '100%',
                    }}
                >
                    <Input
                        fluid
                        as="div"
                        placeholder="Type a question here"
                        icon={<SendIcon />}
                    />
                </div>
            </Flex>
        );
    }

    /**
     * The render() method to create the UI of the tab
     */
    public render() {
        return (
            <div className="meeting-panel">
                {!this.state.activeSessionData && (
                    <div>{this.showCreateSessionForm()}</div>
                )}
                {this.state.activeSessionData && (
                    <div>{this.postQuestions()}</div>
                )}
            </div>
        );
    }
}
