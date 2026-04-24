import { describe, expect, it } from 'vitest';

/**
 * ## layer.decorateTest()
 * @module ui/elements/alert
 */
/**
 * This function is used to test the alert method
 * @function alertTest
 */
export function alert() {
  describe('Alert test:', () => {
    describe('Should create an alert with params provided', () => {
      it('shows the provided title and text', async () => {
        const alert = await mapp.ui.elements.alert({
          title: 'ALERT TITLE',
          text: 'ALERT TEXT',
        });

        expect(alert).toBeDefined();
        expect(alert.title).toEqual('ALERT TITLE');
        expect(alert.text).toEqual('ALERT TEXT');
        alert.close();
      });
    });

    describe('Should create an alert with no params provided', () => {
      it('falls back to the default title', async () => {
        const alert = await mapp.ui.elements.alert({});

        expect(alert).toBeDefined();
        expect(alert.title).toEqual('Information');
        expect(alert.text).toEqual(undefined);
        alert.close();
      });
    });
  });
}
