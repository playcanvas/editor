editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.top');

    var menuProject = new ui.Menu();
    menuProject.class.add('top');
    menuProject.class.add('project');

    menuProject.position(215, 33);
    root.append(menuProject);

    var btnProject = new ui.Button({
        text: 'Project'
    });

    panel.append(btnProject);

    btnProject.on('click', function () {
        menuProject.open = true;
    });

    menuProject.on('open', function (open) {
        if (open) {
            btnProject.class.add('open');
        } else {
            btnProject.class.remove('open');
        }
    });

    editor.method('menu:project', function () { return menuProject; });

});