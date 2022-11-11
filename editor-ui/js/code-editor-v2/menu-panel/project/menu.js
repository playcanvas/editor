editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.top');

    var menuProject = new ui.Menu();
    menuProject.position(245, 33);
    root.append(menuProject);

    var btnProject = new ui.Button({
        text: 'Project'
    });

    panel.append(btnProject);

    editor.call('menu:register', 'project', btnProject, menuProject);
});
