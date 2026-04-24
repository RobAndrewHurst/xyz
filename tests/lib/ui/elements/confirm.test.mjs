import { describe, expect, it } from 'vitest';

/**
 * ## layer.decorateTest()
 * @module ui/elements/confirm
 */
/**
 * This function is used to test the confirm method
 * @function confirmTest
 */
export function confirm() {
  describe('Confirm:', () => {
    describe('Should create a confirm dialog with params provided', () => {
      it('renders the provided title, text, and buttons', () => {
        mapp.ui.elements.confirm({
          title: 'CONFIRM TITLE',
          text: 'CONFIRM TEXT',
          data_id: 'confirm-test',
        });

        // Get the confirm element

        const confirm = document.querySelector('[data-id=confirm-test]');
        expect(confirm).toBeTruthy();
        expect(
          confirm.querySelector('h2').textContent.replace(/^warning/, ''),
        ).toEqual('CONFIRM TITLE');
        expect(confirm.querySelector('p').textContent).toEqual('CONFIRM TEXT');

        // Get the confirm buttons
        const confirm_buttons = confirm.querySelectorAll('button');

        expect(confirm_buttons[0].innerText).toEqual('OK');
        expect(confirm_buttons[1].innerText).toEqual('Cancel');

        // Close the confirm
        confirm.remove();
      });
    });

    describe('Should create a confirm dialog with no params provided', () => {
      it('renders the default title, empty text, and buttons', () => {
        mapp.ui.elements.confirm({ data_id: 'confirm-test' });

        const confirm = document.querySelector('[data-id=confirm-test]');

        expect(confirm).toBeTruthy();
        expect(
          confirm.querySelector('h2').textContent.replace(/^warning/, ''),
        ).toEqual('Confirm');
        expect(confirm.querySelector('p').textContent).toEqual('');

        // Get the confirm buttons
        const confirm_buttons = confirm.querySelectorAll('button');

        expect(confirm_buttons[0].innerText).toEqual('OK');
        expect(confirm_buttons[1].innerText).toEqual('Cancel');

        // Close the confirm
        confirm.remove();
      });
    });
  });
}
