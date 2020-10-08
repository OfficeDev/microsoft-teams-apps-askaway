import { PreventIframe } from 'express-msteams-host';

/**
 * Used as place holder for the decorators
 */
@PreventIframe('/askAwayTab/index.html')
@PreventIframe('/askAwayTab/config.html')
@PreventIframe('/askAwayTab/remove.html')
export class AskAwayTab {}
