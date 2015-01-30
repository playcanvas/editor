editor.once('load', function() {
    'use strict';

    var header = editor.call('layout.header');
    var button;

    ['Translate', 'Rotate', 'Scale'].forEach(function (text) {
        button = new ui.Button({
            text: text
        });

        header.append(button);

        button.on('click', function () {
            var framework = editor.call('viewport:framework');
            if (framework) {
                framework.setActiveGizmoType(text.toLowerCase());
            }
        });
    });

    ['World', 'Local'].forEach(function (text) {
        button = new ui.Button({
            text: text + ' Space'
        });

        header.append(button);

        button.on('click', function () {
            var framework = editor.call('viewport:framework');
            if (framework) {
                framework.setGizmoCoordinateSystem(text.toLowerCase());
            }
        });
    });

});
