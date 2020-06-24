// inspired by: https://github.com/supermacro/neverthrow

/**
 * Result object used to handle success and error scenarios.
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

/**
 * Ok object that handles success scenarios.
 * @param value - Contains the successful result body
 */
export const ok = <T, E>(value: T): Ok<T, E> => new Ok(value);

/**
 * Error object that handles error scenarios.
 * @param value - Contains the error result body
 */
export const err = <T, E>(value: E): Err<T, E> => new Err(value);

/**
 * Contains functions corresponding to Ok class
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
 * Contains functions related to Error class
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
