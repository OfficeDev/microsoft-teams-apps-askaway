import './../index.scss';
import * as React from 'react';
import { useState } from 'react';
import { Flex, Text, Button, Form, Input, TextArea, FlexItem } from '@fluentui/react-northstar';
import { useTranslation } from 'react-i18next';
/**
 * Properties for the CreateSessionInternal React component
 */
export interface CreateSessionInternalProps {
    onSubmitCreateSession: Function;
}
const CreateSessionInternal: React.FunctionComponent<CreateSessionInternalProps> = (props) => {
    const { t } = useTranslation();

    const [input, setInput] = useState({
        title: '',
        description: '',
    });

    const [error, setError] = useState({
        isTitle: false,
        isDescription: false,
    });

    /**
     * Validate the input field
     * @param input
     * @param field
     */
    const validateCreateSessionField = (input, field) => {
        setError({
            ...error,
            [field]: !input,
        });
    };

    /**
     * Validate Create Sesion Form
     */
    const validateCreateSession = (inputData) => {
        setError({
            ...error,
            isTitle: inputData.title.trim() ? false : true,
            isDescription: inputData.description.trim() ? false : true,
        });
    };

    /**
     * Append the value to Input Fields
     * @param e - event
     * @param key - state key value
     */
    const appendInput = (e, key) => {
        const { value } = e.target;
        setInput({
            ...input,
            [key]: value ? value.trim() : '',
        });
    };

    const submitCreateSession = (e) => {
        e.preventDefault();
        validateCreateSession(input);
        if (input && input['title'] && input['description']) {
            props.onSubmitCreateSession(input);
        }
    };

    const showCreateSessionForm = () => {
        return (
            <Flex column>
                <Form onSubmit={(e) => submitCreateSession(e)} className="sidepanel-form" styles={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="form-grid">
                        <Text content={t('popups.sessionTitle')} size="small" />
                        <Input
                            label=""
                            as="div"
                            fluid
                            placeholder={t('popups.sessionTitlePlaceholder')}
                            onKeyUp={(e) => validateCreateSessionField(input.title, 'isTitle')}
                            onChange={(e) => appendInput(e, 'title')}
                        />
                        {error.isTitle && <Text styles={{ display: 'inline-flex' }} error content={t('popups.fieldRequiredMessageTitle')} size="small" />}
                    </div>
                    <div className="form-grid">
                        <Text content={t('popups.sessionDescription')} size="small" />
                        <TextArea
                            fluid
                            styles={{ marginTop: '0.25rem' }}
                            placeholder={t('popups.sessionDescriptionPlaceholder')}
                            onKeyUp={(e) => validateCreateSessionField(input.description, 'isDescription')}
                            onChange={(e) => appendInput(e, 'description')}
                        />
                        {error.isDescription && <Text styles={{ display: 'inline-flex' }} error content={t('popups.fieldRequiredMessageDescription')} size="small" />}
                    </div>
                    <div className="form-grid">
                        <Flex>
                            <FlexItem push>
                                <Button primary type="submit" className="btn-create-session" size="small">
                                    <Button.Content>{t('popups.createQnaSessionButton')}</Button.Content>
                                </Button>
                            </FlexItem>
                        </Flex>
                    </div>
                </Form>
            </Flex>
        );
    };

    return <div style={{ padding: '1rem 2rem' }}>{showCreateSessionForm()}</div>;
};
export default CreateSessionInternal;
