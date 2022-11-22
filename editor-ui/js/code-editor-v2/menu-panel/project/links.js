editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:project');

    // Open project
    let item = new pcui.MenuItem({
        class: 'no-bottom-border',
        text: 'Open Dashboard',
        onSelect: () => {
            return editor.call('editor:command:openProject');
        }
    });
    menu.append(item);

    editor.method('editor:command:openProject', function () {
        window.open('/project/' + config.project.id);
    });

    // Open Editor
    item = new pcui.MenuItem({
        text: 'Open Editor',
        onSelect: () => {
            return editor.call('editor:command:openEditor');
        }
    });
    menu.append(item);

    editor.method('editor:command:openEditor', function () {
        window.open('/editor/project/' + config.project.id);
    });
});
