import { describe, expect, it } from 'vitest';

import scriptElement from '../../../lib/utils/scriptElement.mjs';

export function scriptElementTest() {
  describe('scriptElement:', () => {
    it('loads a script and resolves on load', async () => {
      // Setup: Remove any existing test script
      const testSrc =
        'https://cdn.jsdelivr.net/npm/ol-mapbox-style@13.0.1/dist/olms.js';

      let appended = false;
      const origAppend = document.head.append;
      document.head.append = function (el) {
        appended = true;
        origAppend.call(this, el);
      };

      await scriptElement(testSrc);

      expect(appended).toBe(true);

      document.head.append = origAppend;
    });
  });
}
