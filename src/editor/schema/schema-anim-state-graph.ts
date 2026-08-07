import { deepCopy } from '@/common/utils';

editor.once('load', () => {
    const schema = editor.api.globals.schema;

    /**
     * Returns a JSON object that contains all of the default anim state graph data.
     *
     * @param existingData - If a field already exists in this object
     * then use that instead of the default value.
     */
    editor.method('schema:animstategraph:getDefaultData', (existingData?: object) => {
        const result = {};
        const defaults = schema.assets.getDefaultData('animstategraph') || {};

        for (const key in schema.getFields(schema.getAssetData('animstategraph'))) {
            if (existingData && existingData[key] !== undefined) {
                result[key] = existingData[key];
            } else if (Object.hasOwn(defaults, key)) {
                result[key] = deepCopy(defaults[key]);
            }
        }

        return result;
    });
});
