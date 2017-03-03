editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:project');

    // Open project
    var item = menu.createItem('open-project', {
        title: 'Open Dashboard',
        select: function () {
            return editor.call('editor:command:openProject');
        }
    });
    item.class.add('noBorder');
    menu.append(item);

    editor.method('editor:command:openProject', function () {
        menu.open = false;
        window.open('/project/' + config.project.id);
    });

    // Open Editor
    item = menu.createItem('open-editor', {
        title: 'Open Editor',
        select: function () {
            return editor.call('editor:command:openEditor');
        }
    });
    menu.append(item);

    editor.method('editor:command:openEditor', function () {
        menu.open = false;
        window.open('/editor/project/' + config.project.id);
    });

});