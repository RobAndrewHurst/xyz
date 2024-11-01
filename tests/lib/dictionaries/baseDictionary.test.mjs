
/**
 * This test is used to see if all the language options have the same keys as the English language.
 * English is the base language, so we check that all other languages have the same keys as English.
 * @function baseDictionaryTest
 */
export function baseDictionaryTest() {
    codi.describe('All languages should have the keys as English', () => {

        // English is the base, so we check that all other languages have the same keys as English.
        for (const language of Object.keys(mapp.dictionaries)) {
            // If the language is English, we skip it.
            if (language === 'en') {
                continue;
            }

            // Test other languages have the same keys as English.
            codi.it(`${language} dictionary should have the same keys as English`, () => {
                for (const key of Object.keys(mapp.dictionaries['en'])) {
                    codi.assertTrue(!!mapp.dictionaries[language][key], `${language} should have ${key}`);
                }
            });
        }
    });
}