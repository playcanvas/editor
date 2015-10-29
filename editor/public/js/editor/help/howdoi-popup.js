editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var overlay = new ui.Overlay();
    overlay.class.add('help-howdoi');
    overlay.hidden = true;
    overlay.clickable = true;
    root.append(overlay);

    var panel = new ui.Panel();
    overlay.append(panel);

    var content = new ui.Label();
    content.renderChanges = false;
    panel.append(content);

    var docs = new ui.Button({
        text: 'View Docs'
    });
    docs.class.add('docs');
    panel.append(docs);
    docs.hidden = true;

    var key = function (e) {
        // close on esc
        if (e.keyCode === 27) {
            overlay.hidden = true;
        }
    };

    overlay.on('show', function () {
        editor.emit('help:howdoi:popup:open');
        window.addEventListener('keydown', key);
    });

    overlay.on('hide', function () {
        window.removeEventListener('keydown', key);
        editor.emit('help:howdoi:popup:close');
    });


    editor.method('help:howdoi:popup', function (data) {
        overlay.hidden = false;
        content.text = data.text;

        setTimeout(function () {
            var closeButton = panel.innerElement.querySelector('.close');
            if (closeButton)
                closeButton.addEventListener('click', function () {
                    overlay.hidden = true;
                });
        });
    });

});