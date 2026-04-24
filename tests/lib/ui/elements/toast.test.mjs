import { describe, expect, it } from 'vitest';

export function toast() {
  describe('Toast:', () => {
    it('Toast with no actions', () => {
      const toast = mapp.ui.elements.toast({
        content: 'I am content',
      });
      expect(toast).toBeDefined();
    });
  });
}
