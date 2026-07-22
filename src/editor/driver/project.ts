import { driver } from './driver';
import { log, iterateObject, writeError } from './shared';

// project settings
driver.method('project:settings:modify', (settings) => {
    const denied = writeError('modify project settings');
    if (denied) {
        return denied;
    }
    const project = editor.call('settings:project');
    iterateObject(settings, (path, value) => {
        project.set(path, value);
    });
    log('Modified project settings');

    // return the resulting settings snapshot inline
    return { data: project.json() };
});
driver.method('project:settings:query', () => {
    const project = editor.call('settings:project');
    log('Queried project settings');
    return { data: project.json() };
});
