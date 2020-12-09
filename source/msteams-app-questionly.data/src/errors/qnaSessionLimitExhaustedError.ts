export class QnASessionLimitExhaustedError extends Error {
  code: string;

  constructor(message: string) {
    super(message);
    this.code = "QnASessionLimitExhaustedError";
  }
}
