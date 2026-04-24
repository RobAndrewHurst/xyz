import { describe, expect, it } from 'vitest';

/**
 * @module utils/gazetteer
 */

/**
 * This function is used as an entry point for the gazetteer Test
 * @function gazetteer
 */
export function gazetteer() {
  describe('Utils: gazetteer Test', () => {
    // Mock XMLHttpRequest if not present
    const originalXMLHttpRequest = globalThis.XMLHttpRequest;

    globalThis.XMLHttpRequest = class {
      constructor() {
        this.abort = () => this;
        this.send = () => this;
        this.open = () => this;
        this.setRequestHeader = () => this;
      }
    };

    const term = 'test';

    const gazetteer = {
      leading_wildcard: true,
      limit: 5,
      datasets: [
        {
          mapview: {
            host: 'localhost:3000',
            locale: { key: 'test' },
            layers: {
              layer_3: { key: 'layer_3', qID: 'id' },
            },
          },
          layer: 'layer_3',
          label: 'Store Name',
          qterm: 'store',
          table: 'fake_table',
          no_result: null,
        },
        {
          mapview: {
            host: 'localhost:3000',
            locale: { key: 'test' },
            layers: {
              layer_2: { key: 'layer_2', qID: 'id' },
            },
          },
          layer: 'layer_2',
          label: 'Store Name Also',
          qterm: 'store',
          table: 'fake_table',
          no_result: null,
        },
      ],
    };

    mapp.utils.gazetteer.datasets(term, gazetteer);

    it('XHR should be assigned to datasets', () => {
      const term = 'test';

      const gazetteer = {
        leading_wildcard: true,
        limit: 5,
        datasets: [
          {
            mapview: {
              host: 'localhost:3000',
              locale: { key: 'test' },
              layers: {
                layer_3: { key: 'layer_3', qID: 'id' },
              },
            },
            layer: 'layer_3',
            label: 'Store Name',
            qterm: 'store',
            table: 'fake_table',
            no_result: null,
          },
          {
            mapview: {
              host: 'localhost:3000',
              locale: { key: 'test' },
              layers: {
                layer_2: { key: 'layer_2', qID: 'id' },
              },
            },
            layer: 'layer_2',
            label: 'Store Name Also',
            qterm: 'store',
            table: 'fake_table',
            no_result: null,
          },
        ],
      };

      mapp.utils.gazetteer.datasets(term, gazetteer);

      // Check first dataset
      const ds1 = gazetteer.datasets[0];
      expect(ds1.url.includes('localhost:3000/api/query?')).toBe(true);
      expect(ds1.url.includes('qterm=store')).toBe(true);
      expect(ds1.cache).toBeTruthy();
      expect(ds1.debounce).toEqual('layer_3store');

      // Check second dataset
      const ds2 = gazetteer.datasets[1];
      expect(ds2.url.includes('localhost:3000/api/query?')).toBe(true);
      expect(ds2.url.includes('qterm=store')).toBe(true);
      expect(ds2.cache).toBeTruthy();
      expect(ds2.debounce).toEqual('layer_2store');
    });

    // Restore original XMLHttpRequest
    if (originalXMLHttpRequest) {
      globalThis.XMLHttpRequest = originalXMLHttpRequest;
    } else {
      delete globalThis.XMLHttpRequest;
    }
  });
}
