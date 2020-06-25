// inspired by: https://github.com/supermacro/neverthrow

/**
 * Either a success or errror wrapper
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

/**
 * @param value - expression to pass into success wrapper
 * @returns value wrapped in an Ok object
 */
export const ok = <T, E>(value: T): Ok<T, E> => new Ok(value);

/**
 * @param value - expression to pass into error wrapper
 * @returns value wrapped in an Err object
 */
export const err = <T, E>(value: E): Err<T, E> => new Err(value);

/**
 * Wrapper for success return expressions
 */
export class Ok<T, E> {
    constructor(readonly value: T) {}

    isOk(): this is Ok<T, E> {
        return true;
    }

    isErr(): this is Err<T, E> {
        return !this.isOk();
    }
}

/**
 * Wrapper for error return expressions
 */
export class Err<T, E> {
    constructor(readonly value: E) {}

    isOk(): this is Ok<T, E> {
        return false;
    }

    isErr(): this is Err<T, E> {
        return !this.isOk();
    }
}
