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
    isSessionCreated: boolean;
}

export class MeetingPanel extends React.Component<
    MeetingPanelProps,
    MeetingPanelState
> {
    constructor(props) {
        super(props);
        this.state = {
            isSessionCreated: false,
        };
    }

    componentDidMount() {
        this.getActiveSession();
    }

    public getActiveSession() {
        console.log('props', this.props);

        HttpService.get(
            `/conversations/${this.props.teamsData.chatId}/sessions`
        )
            .then((response: any) => {
                console.log('response', response);
            })
            .catch((error) => {});
    }

    public onSubmitCreateSession(e) {
        this.setState({
            isSessionCreated: true,
        });
        e.preventDefault();
    }

    public showCreateSessionForm() {
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
                        />
                    </div>
                    <div className="form-grid">
                        <Text content="Description" size="small" />
                        <TextArea fluid placeholder="Type a description" />
                    </div>
                    <div className="form-grid">
                        <FlexItem push>
                            <Button className="btn-create-session" size="small">
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

    public postQuestions() {
        return (
            <Flex hAlign="center" vAlign="center">
                <Text
                    align="start"
                    styles={{
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#ffffff',
                    }}
                    content="Connect with Explore Interns"
                    size="medium"
                />
                <div className="no-question">
                    <Image
                        className="no-post-questions"
                        alt="image"
                        styles={{ width: '278px' }}
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
                {!this.state.isSessionCreated && (
                    <div>{this.showCreateSessionForm()}</div>
                )}
                {this.state.isSessionCreated && (
                    <div>{this.postQuestions()}</div>
                )}
            </div>
        );
    }
}
