editor.once('load', function() {
    'use strict';

    if (config.self.openedEditor)
        return;

    if (config.project.name !== 'My First Project')
        return;

    var root = editor.call('layout.root');

    // overlay
    var overlay = new ui.Overlay();
    overlay.hidden = true;
    overlay.clickable = true;
    overlay.class.add('demo');
    root.append(overlay);

    // panel
    var panel = new ui.Panel();
    overlay.append(panel);

    // contents
    var header = new ui.Label({
        text: "Editor Intro"
    });
    header.class.add('header');
    panel.append(header);

    var main = new ui.Label({
        text: "Your first project is a simple ball rolling game we've made for you. To learn how to use PlayCanvas why don't you finish the level we've started and then design some more? We'll pop up some more messages to help you along the way."
    });
    main.class.add('main');
    panel.append(main);

    var close = new ui.Button({
        text: "LET'S GO"
    });
    close.class.add('close');
    panel.append(close);
    close.on('click', function () {
        overlay.hidden = true;
    });

    editor.once('scene:raw', function() {
        overlay.hidden = false;
    });

    overlay.on('show', function () {
        editor.emit('help:demo:show');
    });

    overlay.on('hide', function () {
        editor.emit('help:demo:close');
    });
});
