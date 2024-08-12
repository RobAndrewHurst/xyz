
/**
 * @description This test is used to see if the key value dictionary is working correctly
 * @function keyValueDictionaryTest
 */
export async function keyValueDictionaryTest(mapview) {
    await codi.describe('Key Value Dictionary Tests', async () => {

        await codi.it('should replace the key value dictionary for default value on a layer', async () => {
            // Get the OSM layer from the mapview
            const osm = mapview.layers['osm'];
            console.log(mapview);
            // Check the OSM layer has the correct name
            codi.assertEqual(osm.name, 'OpenStreetMap KeyValue Dictionary');
        });

        await codi.it('should replace the key value dictionary for default value in an infoj', async () => {
            // Get the changeEnd layer from the mapview
            const changeEnd = mapview.layers['changeEnd'];
            // Check the changeEnd infoj entry of field textarea has the correct name
            const entry = changeEnd.infoj.find(entry => entry.key === 'field');
            // Check the changeEnd infoj entry of field textarea has the correct name
            codi.assertEqual(entry.textarea, 'Change End KeyValue Dictionary');

        });

        await codi.it('should not replace the key value dictionary for an array', async () => {
            // Get the changeEnd layer from the mapview
            const changeEnd = mapview.layers['changeEnd'];
            // Check the changeEnd infoj entry of field textarea has the correct name
            const array = changeEnd.test_array
            const expected = {
                'test_array': [
                    'TEST KEYVALUE'
                ]
            };

            // Check the changeEnd infoj entry of field textarea has the correct name
            codi.assertEqual(array, expected);
        });
    });
}
