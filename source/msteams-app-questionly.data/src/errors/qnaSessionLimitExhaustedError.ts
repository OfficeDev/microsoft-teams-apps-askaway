export class QnASessionLimitExhaustedError extends Error {
  code: string | undefined;

  constructor(message: string) {
    super(message);
    this.code = "QnASessionLimitExhaustedError";
  }
}
