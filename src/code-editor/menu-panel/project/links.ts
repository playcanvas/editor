import { MenuItem } from '@playcanvas/pcui';

import { backend } from '@/common/backend';

editor.once('load', () => {
    const menu = editor.call('menu:project');
    const { pages } = backend();

    // Open project
    let item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Open Dashboard',
        enabled: !!pages,
        onSelect: () => {
            return editor.call('editor:command:openProject');
        }
    });
    menu.append(item);

    editor.method('editor:command:openProject', () => {
        if (pages) {
            window.open(pages.project(config.project.id));
        }
    });

    // Open Editor
    item = new MenuItem({
        text: 'Open Editor',
        onSelect: () => {
            return editor.call('editor:command:openEditor');
        }
    });
    menu.append(item);

    editor.method('editor:command:openEditor', () => {
        let url = `/editor/project/${config.project.id}`;
        if (location.search.includes('use_local_frontend')) {
            url += `?use_local_frontend=${new URLSearchParams(location.search).get('use_local_frontend')}`;
        }
        window.open(url);
    });
});
