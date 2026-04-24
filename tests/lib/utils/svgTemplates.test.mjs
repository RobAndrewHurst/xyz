import { describe, expect, it } from 'vitest';

/**
 * @description This module is used to test the svgTemplates util
 * @module /lib/utils/svgTemplates
 */

/**
 * @description This is used as an  entry point for the test module
 * @function svgTemplatesTest
 */
export function svgTemplates() {
  describe('SVG Templates:', () => {
    /**
     * ### We shouldn't be able to replace already existing templates
     * @function it
     */
    it('We should load new svg templates once', async () => {
      const svgTemplates = {
        dot_test: 'I am a bogus svg and shouldnt be loaded',
      };

      await mapp.utils.svgTemplates(svgTemplates);
      const dot_test_svg = await mapp.utils.svgSymbols.templates['dot_test'];
      expect(dot_test_svg).not.toEqual('');
    });
  });
}
