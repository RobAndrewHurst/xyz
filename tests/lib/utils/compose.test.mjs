import { describe, expect, it } from 'vitest';

/**
 * @module lib/utility/compose
 */

/**
 * @description This is used as an entry point for the compose utility test
 * @function composeTest
 */
export function compose() {
  describe('Compose Test:', () => {
    /**
     * ### Should compose functions from left to right
     * @function it
     */
    it('Should compose functions from left to right', () => {
      //Different functions to use
      const addOne = (x) => x + 1;
      const double = (x) => x * 2;
      const square = (x) => x * x;

      //Creating the compose chain
      const composed = mapp.utils.compose(addOne, double, square);

      expect(composed(3)).toEqual(64);
    });

    /**
     * ### Should work with a single function
     * @function it
     */
    it('Should work with a single function', () => {
      const addTwo = (x) => x + 2;

      //Creating the compose chain
      const composed = mapp.utils.compose(addTwo);

      expect(composed(5)).toEqual(7);
    });

    /**
     * ### Should return the input if no functions are provided
     * @function it
     */
    it('Should return the input if no functions are provided', () => {
      //Creating the compose chain
      const composed = mapp.utils.compose();

      expect(composed(10)).toEqual(10);
    });

    /**
     * ### Should handle different data types
     * @function it
     */
    it('Should handle different data types', () => {
      const toUpperCase = (str) => str.toUpperCase();
      const addExclamation = (str) => str + '!';
      const composed = mapp.utils.compose(addExclamation, toUpperCase);

      expect(composed('hello')).toEqual('HELLO!');
    });
  });
}
