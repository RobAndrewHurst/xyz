import { describe, expect, it } from 'vitest';

/**
 * This function is used to test the dialog ui element.
 * @function dialogTest
 */
export function dialog() {
  describe('UI Elements: dialog/modal', () => {
    const createParams = () => ({
      target: document.getElementById('Map'),
      closeBtn: true,
      data_id: 'dialog-test',
      headerDrag: true,
      header: 'I am a header',
      content: 'I am so content',
      top: '5em',
      left: '5em',
      contained: true,
    });

    /**
     * We should be able to create a basic dialog with some params
     * @function it
     */
    it('Should create a basic dialog', () => {
      const params = createParams();
      const dialog = mapp.ui.elements.dialog({ ...params });

      expect(dialog.header.type).toEqual('html');
      expect(document.querySelector('[data-id="dialog-test"]')).toEqual(
        dialog.node,
      );

      dialog.close();
      const dialog_element = document.querySelector('[data-id="dialog-test"]');
      expect(dialog_element).toEqual(null);

      dialog.close();
    });

    /**
     * Created dialog should not call show method
     * @function it
     */
    it('Should recreate a basic dialog', () => {
      const new_params = { ...createParams(), new: true };

      const dialog = mapp.ui.elements.dialog(new_params);
      dialog.close();

      const new_dialog = mapp.ui.elements.dialog(new_params);

      expect(dialog).toEqual(new_dialog);

      new_dialog.close();
    });

    /**
     * Created dialog should have minimize/maximize functionality
     * @function it
     */
    it('Should create a dialog that can minimize/maximize', () => {
      const new_params = { ...createParams(), minimizeBtn: true };

      const dialog = mapp.ui.elements.dialog(new_params);

      const minimizeBtn = dialog.node.querySelector('[data-id=minimize]');

      minimizeBtn.dispatchEvent(new Event('click'));

      let minimized = dialog.node.classList.contains('minimized');

      expect(minimized).toBe(true);

      minimizeBtn.dispatchEvent(new Event('click'));

      minimized = dialog.node.classList.contains('minimized');

      expect(minimized).toBe(false);

      dialog.close();
    });
  });
}
