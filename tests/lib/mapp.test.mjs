import { describe, expect, it } from 'vitest';

export const mappTest = {
  base,
};

/**
 * Function used to test the mapp objct to see if all the base objects * properties are present
 * @function base
 */
function base() {
  describe('Mapp:', () => {
    it('Ensure we have base objects', () => {
      expect(Object.hasOwn(mapp, 'version')).toBe(true);
      expect(Object.hasOwn(mapp, 'hash')).toBe(true);
      expect(Object.hasOwn(mapp, 'host')).toBe(true);
      expect(Object.hasOwn(mapp, 'language')).toBe(true);
      expect(Object.hasOwn(mapp, 'dictionaries')).toBe(true);
      expect(Object.hasOwn(mapp, 'dictionary')).toBe(true);
      expect(Object.hasOwn(mapp, 'hooks')).toBe(true);
      expect(Object.hasOwn(mapp, 'layer')).toBe(true);
      expect(Object.hasOwn(mapp, 'location')).toBe(true);
      expect(Object.hasOwn(mapp, 'Mapview')).toBe(true);
      expect(Object.hasOwn(mapp, 'utils')).toBe(true);
      expect(Object.hasOwn(mapp, 'plugins')).toBe(true);
    });
  });
}
