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

    // frame selection
    button = new ui.Button({
        text: 'Frame'
    });

    header.append(button);

    button.on('click', function () {
        var framework = editor.call('viewport:framework');
        if (framework) {
            framework.frameSelection();
        }
    });


    // shortcuts
    window.addEventListener('keyup', function (e) {
        var framework = editor.call('viewport:framework');
        if (! framework || (e.target && e.target.tagName.toLowerCase() === 'input'))
            return;

        switch (e.keyCode) {
            case 87: // W:
                framework.setActiveGizmoType('translate');
                break;
            case 69: // E:
                framework.setActiveGizmoType('rotate');
                break;
            case 82: // R:
                framework.setActiveGizmoType('scale');
                break;
            case 70: // F:
                framework.frameSelection();
                break;
        }
    });

});
