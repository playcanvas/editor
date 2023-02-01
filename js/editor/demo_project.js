// if you have loading the Demo Ball project for the first time
// we show a splash screen with some simple instructions
editor.once('load', function () {
    'use strict';

    if (editor.call('users:hasOpenedEditor')) {
        return;
    }

    if (config.project.name !== 'My First Project')
        return;

    // do not show if not owner
    if (config.owner.id !== config.self.id)
        return;

    const root = editor.call('layout.root');

    // overlay
    const overlay = new ui.Overlay();
    overlay.hidden = true;
    overlay.clickable = true;
    overlay.class.add('demo');
    root.append(overlay);

    // panel
    const panel = new ui.Panel();
    overlay.append(panel);

    // contents
    const header = new ui.Label({
        text: "Editor Intro"
    });
    header.class.add('header');
    panel.append(header);

    const main = new ui.Label({
        text: "To help you learn PlayCanvas we've created your first project. It's a simple ball rolling game. Complete the design of the level by adding an extra platform, then design your own levels.<br/><br/>We'll pop up some tips to help you along the way.",
        unsafe: true
    });
    main.class.add('main');
    panel.append(main);

    const close = new ui.Button({
        text: "LET'S GO"
    });
    close.class.add('close');
    panel.append(close);
    close.on('click', function () {
        overlay.hidden = true;
    });

    editor.once('scene:raw', function () {
        overlay.hidden = false;
    });

    overlay.on('show', function () {
        editor.emit('help:demo:show');
    });

    overlay.on('hide', function () {
        editor.emit('help:demo:close');
    });
});
