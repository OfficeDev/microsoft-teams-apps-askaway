export interface TraceData {
  /**
   * custom message.
   */
  message?: string;

  /**
   * activity id.
   */
  activityId?: string;

  /**
   * chat conversation id.
   */
  conversationId?: string;

  /**
   * qna session id.
   */
  qnaSessionId?: string;

  /**
   * question id.
   */
  questionId?: string;

  /**
   * question content
   */
  questionContent?: string;

  /**
   * meeting id.
   */
  meetingId?: string;

  /**
   * tenant id.
   */
  tenantId?: string;

  /**
   * host user id
   */
  hostUserId?: string;

  /**
   * User aad object id.
   */
  userAadObjectId?: string;

  /**
   * qna session title
   */
  sessionTitle?: string;

  /**
   * is channel flag
   */
  isChannel?: boolean;

  /**
   * file name
   */
  filename?: string;

  /**
   * name of the exception
   */
  exceptionName?: string;

  /**
   * API path
   */
  apiPath?: string;

  /**
   * teams user id. This 29:xxx ID.
   */
  userId?: string;

  /**
   * Http method
   */
  httpMethod?: string;

  /**
   * Property bag for additional params.
   */
  properties?: { [key: string]: any };
}
