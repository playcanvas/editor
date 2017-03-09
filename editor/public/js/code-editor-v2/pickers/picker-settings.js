editor.once('load', function() {
    'use strict';

    // overlay
    var overlay = new ui.Overlay();
    overlay.class.add('picker-settings');
    overlay.hidden = true;

    var root = editor.call('layout.root');
    root.append(overlay);

    var panel = new ui.Panel('PREFERENCES');
    overlay.append(panel);

    var addField = function (name, field) {
        var container = new ui.Panel();
        container.class.add('field-container');
        var label = new ui.Label({
            text: name
        });
        container.append(label);
        container.append(field);
        panel.append(container);
    };

    var fieldFontSize = new ui.NumberField();
    addField('Font Size', fieldFontSize);

    var fieldContinueComments = new ui.Checkbox();
    addField('Continue Comments', fieldContinueComments);

    overlay.on('show', function () {
        editor.emit('picker:settings:open');;
    });

    overlay.on('hide', function() {
        editor.emit('picker:settings:close');
    });

    editor.method('picker:settings', function () {
        overlay.hidden = false;
    });

});
