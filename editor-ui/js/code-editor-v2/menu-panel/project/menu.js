editor.once('load', function () {
    'use strict';

    const root = editor.call('layout.root');
    const panel = editor.call('layout.top');

    const menuProject = new ui.Menu();
    menuProject.position(245, 33);
    root.append(menuProject);

    const btnProject = new ui.Button({
        text: 'Project'
    });

    panel.append(btnProject);

    editor.call('menu:register', 'project', btnProject, menuProject);
});
