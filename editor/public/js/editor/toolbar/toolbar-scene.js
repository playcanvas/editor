editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var viewport = editor.call('layout.viewport');

    var panel = new ui.Panel();
    panel.class.add('widget-title');
    viewport.append(panel);

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
        text: 'Scene Settings',
        align: 'top',
        root: root
    });

    editor.on('scene:name', function(name) {
        sceneName.text = name;
    });

    sceneName.on('click', function() {
        editor.call('selector:set', 'designerSettings', [ editor.call('designerSettings') ]);
    });

    editor.on('attributes:clear', function() {
        sceneName.class.remove('active');
    });

    editor.on('attributes:inspect[designerSettings]', function() {
        sceneName.class.add('active');
    });

    editor.on('scene:unload', function () {
        sceneName.text = '';
    });

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
