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

    var sceneName = new ui.Label();
    sceneName.class.add('scene-name');
    sceneName.renderChanges = false;
    panel.append(sceneName);

    var tooltip = Tooltip.attach({
        target: sceneName.element,
        text: 'Settings',
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
});
