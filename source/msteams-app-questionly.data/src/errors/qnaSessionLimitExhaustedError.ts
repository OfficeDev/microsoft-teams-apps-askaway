// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export class QnASessionLimitExhaustedError extends Error {
  code: string;

  constructor(message: string) {
    super(message);
    this.code = "QnASessionLimitExhaustedError";
  }
}
