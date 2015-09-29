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
    var buildLevel = new ui.Label({
        text: 'Build A Level'
    });
    buildLevel.class.add('build-level');
    panel.append(buildLevel);

    var header = new ui.Label({
        text: "Here's a simple game to get you started."
    });
    header.class.add('header');
    panel.append(header);

    var main = new ui.Label({
        text: 'Use Duplicate <span class="font-icon">&#57908;</span> and Translate <span class="font-icon">&#58454;</span> to design a new level.<br/><br/>Launch <span class="font-icon launch">&#57922;</span> the game to try it.'
    });
    main.class.add('main');
    panel.append(main);

    var close = new ui.Button({
        text: "GOT IT"
    });
    close.class.add('close');
    panel.append(close);
    close.on('click', function () {
        overlay.hidden = true;
    });

    editor.once('help:controls:close', function() {
        overlay.hidden = false;
    });
});
