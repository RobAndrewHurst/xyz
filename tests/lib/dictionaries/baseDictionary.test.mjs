import { describe, expect, it } from 'vitest';

/**
 * This test is used to see if all the language options have the same keys as the English language.
 * English is the base language, so we check that all other languages have the same keys as English.
 * @function baseDictionaryTest
 */
export function baseDictionaryTest() {
  describe('All languages should have the keys as English', () => {
    const nonEnglishLanguages = Object.keys(mapp.dictionaries).filter(
      (language) => language !== 'en',
    );

    if (nonEnglishLanguages.length === 0) {
      it('loads the English dictionary', () => {
        expect(Object.hasOwn(mapp.dictionaries, 'en')).toBe(true);
      });

      return;
    }

    // English is the base, so we check that all other languages have the same keys as English.
    for (const language of nonEnglishLanguages) {
      // Ensure that there are no keys that the english language doesn't have
      it(`${language} dictionary should have the same keys as English`, () => {
        for (const key of Object.keys(mapp.dictionaries[language])) {
          expect(
            Object.hasOwn(mapp.dictionaries.en, key),
            `${language} has ${key} in the base english`,
          ).toBe(true);
        }
      });
    }
  });
}
