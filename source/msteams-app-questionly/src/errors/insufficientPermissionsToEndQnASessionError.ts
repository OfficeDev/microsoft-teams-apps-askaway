export class InsufficientPermissionsToEndQnASessionError extends Error {
    code: string | undefined;

    constructor(message: string) {
        super(message);
        this.code = 'InsufficientPermissionsToEndQnASessionError';
    }
}
