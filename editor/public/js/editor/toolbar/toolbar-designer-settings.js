editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    // settings button
    var button = new ui.Button({
        text: '&#58152;'
    });
    button.class.add('icon', 'designer-settings');
    toolbar.append(button);

    button.on('click', function() {
        editor.call('selector:set', 'designerSettings', [ editor.call('designerSettings') ]);
    });

    editor.on('attributes:clear', function() {
        button.class.remove('active');
    });

    editor.on('attributes:inspect[designerSettings]', function() {
        editor.call('attributes.rootPanel').folded = false;

        button.class.add('active');
    });

    editor.on('viewport:expand', function(state) {
        button.disabled = state;
    });

    Tooltip.attach({
        target: button.element,
        text: 'Settings',
        align: 'left',
        root: editor.call('layout.root')
    });
});
