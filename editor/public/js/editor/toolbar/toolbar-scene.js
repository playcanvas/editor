editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var viewport = editor.call('layout.viewport');

    var panel = new ui.Panel();
    panel.class.add('widget-title');
    viewport.append(panel);

    editor.method('layout.toolbar.scene', function () {
        return panel;
    });

    var projectName = new ui.Label();
    projectName.text = config.project.name;
    projectName.class.add('project-name');
    projectName.renderChanges = false;
    panel.append(projectName);

    projectName.on('click', function (argument) {
        window.open('/project/' + config.project.id, '_blank');
    });

    Tooltip.attach({
        target: projectName.element,
        text: 'Project',
        align: 'top',
        root: root
    });

    var sceneName = new ui.Label();
    sceneName.class.add('scene-name');
    sceneName.renderChanges = false;
    panel.append(sceneName);

    Tooltip.attach({
        target: sceneName.element,
        text: 'Settings',
        align: 'top',
        root: root
    });

    editor.on('scene:name', function (name) {
        sceneName.text = name;
    });

    sceneName.on('click', function () {
        editor.call('selector:set', 'editorSettings', [editor.call('settings:projectUser')]);
    });

    editor.on('attributes:clear', function () {
        sceneName.class.remove('active');
    });

    editor.on('attributes:inspect[editorSettings]', function () {
        sceneName.class.add('active');
    });

    editor.on('scene:unload', function () {
        sceneName.text = '';
    });

    if (! config.project.settings.useLegacyScripts) {
        var name = config.self.branch.name;
        if (name.length > 33) {
            name = name.substring(0, 30) + '...';
        }
        var branchButton = new ui.Label({
            text: name
        });
        branchButton.class.add('branch-name');
        panel.append(branchButton);
        branchButton.on('click', function () {
            editor.call('picker:versioncontrol');
        });

        Tooltip.attach({
            target: branchButton.element,
            text: 'Version Control',
            align: 'top',
            root: root
        });

        // hide version control picker if we are not part of the team
        if (! editor.call('permissions:read')) {
            branchButton.hidden = true;
        }
        editor.on('permissions:set', function () {
            branchButton.hidden = ! editor.call('permissions:read');
        });
    }

    var sceneList = new ui.Label();
    sceneList.class.add('scene-list');
    panel.append(sceneList);

    Tooltip.attach({
        target: sceneList.element,
        text: 'Manage Scenes',
        align: 'top',
        root: root
    });

    sceneList.on('click', function () {
        editor.call('picker:scene');
    });

    editor.on('picker:scene:open', function () {
        sceneList.class.add('active');
    });

    editor.on('picker:scene:close', function () {
        sceneList.class.remove('active');
    });
});
