import { describe, expect, it } from 'vitest';

//json asset used for testing the jsonParser.
import jsonParserAsset from '../../assets/userLocale/jsonParser.json';
/**
 * This is the jsonParser entry test
 * @function jsonParser
 */
export function jsonParser() {
  describe('jsonParser Test:', () => {
    const jsonObject = mapp.utils.jsonParser(jsonParserAsset);

    it('Check plugins', () => {
      const plugins = jsonObject.locale.plugins;
      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBe(3);
    });

    it('Check keys', () => {
      const expectedKeys = {
        falseKey: false,
        trueKey: true,
        nullKey: null,
      };

      Object.keys(expectedKeys).forEach((key) => {
        expect(jsonObject.locale[key]).toEqual(expectedKeys[key]);
      });
    });

    it('Check for nested arrays', () => {
      const lordArrArr = jsonObject.locale.lordArrArr;

      expect(Array.isArray(lordArrArr)).toBe(true);
      expect(Array.isArray(lordArrArr[0][1])).toBe(true);
    });

    it('Check stringyfied json', () => {
      const jsonParserAssetString = JSON.stringify(jsonParserAsset);
      const jsonObjectString = JSON.stringify(jsonObject);

      expect(jsonObjectString).toEqual(jsonParserAssetString);
    });
  });
}
