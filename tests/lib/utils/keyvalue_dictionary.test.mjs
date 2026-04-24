import { describe, expect, it } from 'vitest';

export function keyvalue_dictionary() {
  describe('Key Value Dictionary:', () => {
    it('object doesnt have keyvalue', () => {
      const obj = {};

      mapp.utils.keyvalue_dictionary(obj);

      expect(obj).toEqual({});
    });

    it('object with keys', () => {
      const obj = {
        keyvalue_dictionary: [
          {
            key: 'firstKey',
            value: 'OSM',
            default: 'OpenStreetMap',
            uk: 'Sława OpenStreetMap 🇺🇦',
          },
          {
            key: 'secondKey',
            value: 'OpenStreetMap',
            en: 'OpenStreetMap 🇬🇧',
          },
        ],
        layers: {
          layer1: {
            firstKey: 'OSM',
            secondKey: 'OpenStreetMap',
          },
        },
      };

      mapp.user = {
        language: 'uk',
      };

      mapp.utils.keyvalue_dictionary(obj);

      expect(obj.layers.layer1.firstKey).toEqual('Sława OpenStreetMap 🇺🇦');
      expect(obj.layers.layer1.secondKey).toEqual('OpenStreetMap');
    });
  });
}
