import { describe, expect, it, vi } from 'vitest';

/**
 * @module utils/dateTime
 */

/**
 * This function is used as an entry point for the dateTime Test
 * @function dateTime
 */
export function temporal() {
  describe('Utils: dateTime Test', () => {
    const params = {
      value: 1702483200, // December 13, 2023
      locale: 'en-GB',
      options: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    };

    /**
     * ### Should format en-GB locale Date/Time
     * @function it
     */
    it('Should format en-GB locale Date/Time', () => {
      const expectedDate = '13 December 2023 at 18:00';
      const date = mapp.utils.temporal.dateString(params);

      expect(date).toEqual(expectedDate);
    });

    /**
     * ### Should convert date string to Unix timestamp
     * @function it
     */
    it('Should convert date string to Unix timestamp', () => {
      const testCases = [
        { input: '2024-01-01 GMT', expected: 1704067200 }, // ISO date
        { input: '01/01/2024 GMT', expected: 1704067200 }, // MM/DD/YYYY
        { input: 'January 1, 2024 GMT', expected: 1704067200 }, // Month DD, YYYY
        { input: '2024.01.01 GMT', expected: 1704067200 }, // YYYY.MM.DD
        { input: '1 Jan 2024 GMT', expected: 1704067200 }, // D MMM YYYY
      ];

      testCases.forEach(({ input, expected }) => {
        const epoch = mapp.utils.temporal.dateToUnixEpoch(input);
        expect(epoch).toEqual(expected);
      });
    });

    /**
     * ### Should log an error for invalid date strings
     * @function it
     */
    it('Should log an error for invalid date strings', () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const invalidDates = [
        'not a date',
        '2024-13-01', // invalid month
        '2024-01-32', // invalid day
        '01/32/2024', // invalid day US format
        '2024/13/01', // invalid month
        {}, // object
        [], // array
        '   ', // whitespace
        'Tomorrow', // relative dates not supported
      ];

      // Call the function for each invalid date
      invalidDates.forEach((invalidDate) => {
        mapp.utils.temporal.dateToUnixEpoch(invalidDate);
      });

      expect(consoleError).toHaveBeenCalledTimes(invalidDates.length);
      for (const call of consoleError.mock.calls) {
        expect(call[0]).toBe('Invalid date string provided');
      }
      consoleError.mockRestore();
    });

    /**
     * ### Should format unix timestamps to date time
     * @function it
     */
    it('Should format unix timestamps to date time', () => {
      const epoch = 1704067200;
      const datetime = mapp.utils.temporal.datetime(epoch);

      expect(datetime).toEqual('2024-01-01T00:00:00');
    });

    /**
     * ### Should format unix timestamps to date
     * @function it
     */
    it('Should format unix timestamps to date', () => {
      const epoch = 1704067200;
      const datetime = mapp.utils.temporal.date(epoch);

      expect(datetime).toEqual('2024-01-01');
    });
  });
}
