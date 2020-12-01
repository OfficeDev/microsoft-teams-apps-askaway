export class InsufficientPermissionsToCreateQnASessionError extends Error {
    code: string | undefined;

    constructor(message: string) {
        super(message);
        this.code = 'InsufficientPermissionsToCreateQnASessionError';
    }
}
