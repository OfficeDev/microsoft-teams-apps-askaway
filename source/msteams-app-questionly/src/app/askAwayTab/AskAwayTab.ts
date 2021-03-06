// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PreventIframe } from 'express-msteams-host';

/**
 * Used as place holder for the decorators
 */
@PreventIframe('/askAwayTab/index.html')
@PreventIframe('/askAwayTab/config.html')
@PreventIframe('/askAwayTab/popups/createsession.html')
@PreventIframe('/askAwayTab/popups/qnaSessioncreatednotification.html')
@PreventIframe('/askAwayTab/popups/switchSession.html')
@PreventIframe('/askAwayTab/signInSimpleEnd.html')
export class AskAwayTab {}
