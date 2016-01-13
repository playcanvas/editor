editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var toolbar = editor.call('layout.toolbar');

    // coordinate system
    var buttonBake = new ui.Button({
        text: '&#57745;'
    });
    buttonBake.class.add('pc-icon');
    toolbar.append(buttonBake);

    buttonBake.on('click', function () {
        editor.call('viewport:framework').lightMapper.bake();
    });

    var tooltipBake = Tooltip.attach({
        target: buttonBake.element,
        align: 'left',
        root: root
    });
    tooltipBake.html = 'Bake LightMaps';
    // tooltipBake.class.add('innactive');
});


