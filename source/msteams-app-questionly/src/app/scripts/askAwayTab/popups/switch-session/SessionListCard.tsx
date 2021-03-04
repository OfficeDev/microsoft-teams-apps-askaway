import { Flex, Text } from '@fluentui/react-northstar';
import { TFunction } from 'i18next';
import * as React from 'react';
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import Badge from '../../shared/Badge';
import Helper from '../../shared/Helper';
import { ThemeProps, withTheme } from '../../shared/WithTheme';
import './../../index.scss';

export interface SessionListCardProps {
    /**
     * Q&A session that needs to be rendered in card.
     */
    qnaSession: ClientDataContract.QnaSession;
    /**
     * TFunction to localize strings.
     */
    t: TFunction;
}

/**
 * Session switcher task module session card.
 */
const SessionListCard: React.FunctionComponent<SessionListCardProps & ThemeProps> = (props) => {
    const qnaSession = props.qnaSession;
    const colorScheme = props.theme.siteVariables.colorScheme;
    return (
        <div key={qnaSession.sessionId} id="switchSessionListCard" style={{ borderColor: colorScheme.default.border }} className="switchSessionListCard">
            <Flex gap="gap.small">
                <Text size="medium"> {qnaSession.title} </Text>
                {qnaSession.isActive && <Badge className="liveTag" styles={{ backgroundColor: colorScheme.green.background, color: colorScheme.green.foreground1 }} text={props.t('popups.live')} />}
            </Flex>
            <Text styles={{ color: colorScheme.default.foreground1 }} size="small" className="sessionMetadata">
                {props.t('popups.sessionCreatedDate', { date: Helper.createDateString(qnaSession.dateTimeCreated) })}
            </Text>
        </div>
    );
};
export default withTheme(SessionListCard);
