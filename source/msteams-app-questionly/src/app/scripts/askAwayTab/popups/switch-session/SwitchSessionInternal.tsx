import './../../index.scss';
import * as React from 'react';
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import { useTranslation } from 'react-i18next';
import SessionList from './SessionList';
import { Loader } from '@fluentui/react-northstar';
/**
 * Properties for the SwitchSessionInternal React component
 */
export interface SwitchSessionInternalProps {
    /**
     * Q&A session list.
     */
    qnaSessions: ClientDataContract.QnaSession[] | null;
    /**
     * Boolean representing if error should be shown.
     */
    showError: boolean;
    /**
     * Id of the session, that is selected.
     */
    selectedSessionId: string | null;
}

export const SwitchSessionInternal: React.FunctionComponent<SwitchSessionInternalProps> = (props) => {
    const { t } = useTranslation();

    return (
        <React.Fragment>
            {!props.showError && props?.qnaSessions && (
                <SessionList t={t} selectedSessionIndex={props.qnaSessions.findIndex((session) => session.sessionId === props.selectedSessionId)} qnaSessions={props?.qnaSessions}></SessionList>
            )}
            {!props.showError && !props.qnaSessions && <Loader className="centerContent" label={t('popups.loaderText')} />}
            {props.showError && (
                <div id="error" className="centerContent">
                    {' '}
                    {t('TaskModuleMessages.GenericErrorMessage')}
                </div>
            )}
        </React.Fragment>
    );
};
