export class DocumentNotAvailableForOperationError extends Error {
  code: string;

  /**
   * Error when document is locked and not available for certain operations.
   */
  constructor() {
    super("Document is not available to support this operation");
    this.code = "DocumentNotAvailableForOperationError";
  }
}
