editor.once('load', function() {
    'use strict';

    if (config.self.openedEditor)
        return;

    if (config.project.name !== 'My First Project')
        return;

    // do not show if not owner
    if (config.owner.id !== config.self.id)
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
        text: "To help you learn PlayCanvas we've created your first project. It's a simple ball rolling game. Complete the design of the level by adding an extra platform, then design your own levels.<br/><br/>We'll pop up some tips to help you along the way."
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
