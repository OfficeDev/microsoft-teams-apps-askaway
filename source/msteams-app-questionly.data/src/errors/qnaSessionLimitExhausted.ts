export class QnASessionLimitExhausted extends Error {
  code: string | undefined;

  constructor(message: string) {
    super(message);
    this.code = "QnASessionLimitExhausted";
  }
}
