export class SessionIsNoLongerActiveError extends Error {
  code: string;

  /**
   * Error when update operations are performed on QnA session which is ended.
   */
  constructor() {
    super("QnA session is no longer active.");
    this.code = "SessionIsNoLongerActiveError";
  }
}
