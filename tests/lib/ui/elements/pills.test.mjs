import { describe, expect, it } from 'vitest';

/**
 * ## layer.changeEndTest()
 * @module ui/elements/pills
 */

/**
 * This is the entry function for the pills test.
 * @function pillsTest
 */
export function pills() {
  describe('Pills test:', () => {
    //creating the pills component without any params
    const pillsComponent = mapp.ui.elements.pills();

    console.log(pillsComponent);

    /**
     * We should be able to create a pills component with 0 params
     * We check if there is an add/remove function on the returned componenent.
     * We also check if we have a pills set
     * @fucntion it
     */
    it('Should create pills', () => {
      expect(typeof pillsComponent.add).toBe('function');
      expect(typeof pillsComponent.remove).toBe('function');
      expect(typeof pillsComponent.pills).toBe('object');
    });

    /**
     * Testing if we can add pills with the add function.
     * @function it
     */
    it('We should be able to add pills', () => {
      pillsComponent.add('pill');
      expect(pillsComponent.pills.size).toBe(1);
    });

    /**
     * Testing if we can remove a pill with the remove function.
     * @function it
     */
    it('We should be able to remove pills', () => {
      pillsComponent.remove('pill');
      expect(pillsComponent.pills.size).toBe(0);
    });
  });
}
