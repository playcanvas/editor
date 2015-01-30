editor.once('load', function() {
    'use strict';

    var header = editor.call('layout.header');
    var button;

    // create gizmo type buttons
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

    // create coordinate system buttons
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

    // create shortcuts
    var shortcuts = {
        87: 'translate',
        69: 'rotate',
        82: 'scale'
    }

    window.addEventListener('keyup', function (e) {
        if (shortcuts[e.keyCode]) {
            var framework = editor.call('viewport:framework');
            if (framework) {
                framework.setActiveGizmoType(shortcuts[e.keyCode]);
            }
        }
    });

});
