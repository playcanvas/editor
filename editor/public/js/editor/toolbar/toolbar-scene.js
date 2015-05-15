editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var viewport = editor.call('layout.viewport');

    var panel = new ui.Panel();
    panel.class.add('widget-title');
    viewport.append(panel);

    var tooltip = Tooltip.attach({
        target: panel.element,
        text: 'Settings',
        align: 'top',
        root: root
    });

    var sceneName = new ui.Label();
    sceneName.class.add('scene-name');
    sceneName.renderChanges = false;
    panel.append(sceneName);

    editor.on('scene:name', function(name) {
        sceneName.text = name;
    });

    panel.on('click', function() {
        editor.call('selector:set', 'designerSettings', [ editor.call('designerSettings') ]);
    });

    editor.on('attributes:clear', function() {
        panel.class.remove('active');
    });

    editor.on('attributes:inspect[designerSettings]', function() {
        panel.class.add('active');
    });
});
