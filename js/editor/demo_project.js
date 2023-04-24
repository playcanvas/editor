import { Button, Container, Label, Overlay } from '@playcanvas/pcui';

// When loading the Tutorial Rolling Ball project for the first time,
// show a splash screen with some simple instructions
editor.once('load', function () {
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
    const overlay = new Overlay({
        class: 'demo',
        clickable: true,
        hidden: true
    });
    root.append(overlay);

    // container
    const container = new Container();
    overlay.append(container);

    // contents
    const header = new Label({
        class: 'header',
        text: 'Editor Intro'
    });
    container.append(header);

    const main = new Label({
        class: 'main',
        text: `To help you learn PlayCanvas we've created your first project. It's a simple ball rolling game. Complete the design of the level by adding an extra platform, then design your own levels.<br><br>We'll pop up some tips to help you along the way.`,
        unsafe: true
    });
    container.append(main);

    const close = new Button({
        class: 'close',
        text: `LET'S GO`
    });
    container.append(close);
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
