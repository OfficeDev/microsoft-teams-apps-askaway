/**
 * Checks if parameter is defined.
 * @param param:  request param.
 * @returns - true if parameter is valid.
 */
export const isValidParam = (param: any): boolean => {
  return param !== undefined && param !== null;
};
