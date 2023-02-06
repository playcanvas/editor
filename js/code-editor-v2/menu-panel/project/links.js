import { MenuItem } from '@playcanvas/pcui';

editor.once('load', function () {
    const menu = editor.call('menu:project');

    // Open project
    let item = new MenuItem({
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
    item = new MenuItem({
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
