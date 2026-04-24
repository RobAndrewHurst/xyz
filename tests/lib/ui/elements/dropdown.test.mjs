import { describe, expect, it } from 'vitest';

export function dropdown() {
  describe('Dropdown:', () => {
    it('Dropdown basic test', () => {
      const params = {
        entries: [
          {
            field: 'ting_field_1',
            label: 'ting_1',
            option: 'ting_1',
            selected: true,
          },
          {
            field: 'ting_field_2',
            label: 'ting_2',
            option: 'ting_2',
            selected: false,
          },
          {
            field: 'ting_field_3',
            label: 'ting_3',
            option: 'ting_3',
            selected: false,
          },
        ],
      };

      const node = mapp.ui.elements.dropdown(params);

      const select = node.querySelector('select');

      const items = node.querySelectorAll('option');

      expect(node).toBeTruthy();
      expect(select).not.toBe(null);
      expect(items.length).toBe(4);
      expect(items[0].value).toBe('');
      expect(items[1].value).toBe('ting_1');
    });
  });
}
