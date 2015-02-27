editor.once('load', function() {
    'use strict';

    var viewport = editor.call('layout.viewport');


    // panel
    var panel = new ui.Panel();
    panel.class.add('top-controls');
    viewport.append(panel);


    // fullscreen
    var buttonExpand = new ui.Button({
        text: '&#57665;'
    });
    buttonExpand.class.add('icon', 'expand');
    panel.append(buttonExpand);

    buttonExpand.on('click', function() {
        editor.call('viewport:expand');
    });
    editor.on('viewport:expand', function(state) {
        buttonExpand.text = state ? '&#57656;' : '&#57665;';
        if (state) {
            buttonExpand.class.add('active');
        } else {
            buttonExpand.class.remove('active');
        }
    });


    // launch
    var buttonLaunch = new ui.Button({
        text: '&#57922;'
    });
    buttonLaunch.class.add('icon', 'launch');
    panel.append(buttonLaunch);

    buttonLaunch.on('click', function() {
        window.open(config.scene.id + '/launch');
    });
});
