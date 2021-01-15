/**
 * Returns `value` if it's a Number, otherwise `otherwise` will be returned
 * @param value - expression that will be returned truthy
 * @param otherwise - expression that will be return if `value` is falsy
 */
export const ifNumber = (value, otherwise: number) => {
    try {
        return Number(value) ? Number(value) : otherwise;
    } catch {
        return otherwise;
    }
};

/**
 * Checks if a given parameter is a valid string.
 * @param param - parameter.
 * @returns - true if parameter is a valid string.
 */
export const isValidStringParameter = (param: string | undefined | null): boolean => {
    return param !== undefined && param !== null && param !== '';
};
