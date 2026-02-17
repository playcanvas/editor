import { config } from '@/code-editor/config';
import { deepCopy, insert, remove, set, unset } from '@/common/utils';

editor.once('load', () => {
    const schema = editor.api.globals.schema;
    const projectSettings = Object.assign(schema.settings.getDefaultProjectSettings(), config.project.settings);

    const settings = editor.call('settings:create', {
        name: 'project',
        id: config.project.settings.id,
        data: projectSettings
    });

    // Get settings
    editor.method('editor:settings:project', () => {
        return settings;
    });

    // sync settings with config
    settings.on('*:set', (path: string, value: unknown) => {
        set(config.project.settings, path, typeof value === 'object' ? deepCopy(value) : value);
    });
    settings.on('*:unset', (path: string) => {
        unset(config.project.settings, path);
    });
    settings.on('*:insert', (path, value, index) => {
        insert(config.project.settings, path, value, index);
    });
    settings.on('*:remove', (path, _value, index) => {
        remove(config.project.settings, path, index);
    });
});
