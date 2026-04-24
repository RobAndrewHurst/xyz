/**
 * @module utils/versionCheck
 */

import { describe, expect, it } from 'vitest';

/**
 * This function is used to test the versionCheck function
 * @function versionCheck
 */
export function versionCheck() {
  describe('versionCheck Test:', () => {
    it('should return false if the major and minor are the same but version patch exceeds', () => {
      mapp.version = '4.11.1';

      const result = mapp.utils.versionCheck('4.11');

      expect(result).toEqual(true);
    });

    it('should return true if the major version is more than', () => {
      mapp.version = '4.9.1';

      const result = mapp.utils.versionCheck('3.9');

      expect(result).toEqual(true);
    });

    it('should return false if the major version is the same and the minor version is less', () => {
      mapp.version = '4.9.0';

      const result = mapp.utils.versionCheck('4.10.0');

      expect(result).toEqual(false);
    });

    it('should return true if the major version is the same and the minor version is more', () => {
      mapp.version = '4.11.0';

      const result = mapp.utils.versionCheck('4.10.0');

      expect(result).toEqual(true);
    });

    it('should return true if the major version is the same and the minor version is the same', () => {
      mapp.version = '4.11.2';

      const result = mapp.utils.versionCheck('4.11.1');

      expect(result).toEqual(true);
    });
  });
}
