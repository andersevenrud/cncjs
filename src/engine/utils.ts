/*!
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

/**
 * Throttles a function
 */
export const throttle = (fn: Function, time: number = 100): any => {
  let timeout: number;
  return (): void => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, time);
  };
};

/**
 * Check if integer number
 */
export const isInt = (i: number): boolean => i % 1 === 0;

/**
 * Check if float number
 */
export const isFloat = (i: number): boolean => !isInt(i);

/**
 * Check if negative number
 */
export const isNegative = (i: number): boolean => Object.is(-0, i) || i < 0;

/**
 * Capitalizes word
 */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
