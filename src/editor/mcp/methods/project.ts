import { mcp } from '../connection';

import { log, iterateObject } from './shared';

// project settings
mcp.method('project:settings:modify', (settings) => {
    const project = editor.call('settings:project');
    iterateObject(settings, (path, value) => {
        project.set(path, value);
    });
    log('Modified project settings');

    // return the resulting settings snapshot inline
    return { data: project.json() };
});
mcp.method('project:settings:query', () => {
    const project = editor.call('settings:project');
    log('Queried project settings');
    return { data: project.json() };
});
