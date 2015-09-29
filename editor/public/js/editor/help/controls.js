editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');

    var overlay = new ui.Overlay();
    overlay.class.add('help-controls');
    overlay.style.zIndex = 203;
    overlay.center = true;
    overlay.hidden = true;

    // header
    var header = new ui.Label();
    header.text = '<span class="icon">&#57976;</span>Controls';
    header.class.add('header');
    overlay.append(header);

    // close
    var btnClose = new ui.Button();
    btnClose.class.add('close');
    btnClose.text = '&#58422;';
    btnClose.on('click', function() {
        overlay.hidden = true;
        editor.emit('help:controls:close');
    });
    header.element.appendChild(btnClose.element);

    // top image
    var imgTop = new Image();
    imgTop.src = 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/images/help-controls.png';
    imgTop.classList.add('top');
    overlay.append(imgTop);

    var items = [
        {
            buttons: [ 'Ctrl', '$+', 'N' ],
            title: 'New Entity',
            icons: [ '&#58468;' ]
        }, {
            buttons: [ 'Ctrl', '$+', 'C' ],
            title: 'Copy Entity',
            icons: [ '&#57891;' ]
        }, {
            buttons: [ 'Ctrl', '$+', 'V' ],
            title: 'Paste Entity',
            icons: [ '&#57892;' ]
        }, {
            buttons: [ 'Ctrl', '$+', 'D' ],
            title: 'Duplicate Entity',
            icons: [ '&#57908;' ]
        }, {
            buttons: [ 'Ctrl', '$+', 'Z' ],
            title: 'Undo',
            icons: [ '&#57654;' ]
        }, {
            buttons: [ 'Ctrl', '$+', 'Y' ],
            title: 'Redo',
            icons: [ '&#57655;' ]
        }, {
            buttons: [ 'Ctrl', '$+', 'Enter' ],
            title: 'Launch Game',
            icons: [ '&#57922;' ]
        }, {
            buttons: [ 'Space' ],
            title: 'Hide Panels',
            icons: [ '&#57665;' ]
        }, {
            buttons: [ '1', '2', '3' ],
            title: 'Translate / Rotate / Scale Gizmo',
            icons: [ '&#57667;', '&#57670;', '&#58454;' ]
        }
    ];

    for(var i = 0; i < items.length; i++) {
        var row = document.createElement('div');
        row.classList.add('row');

        var buttons = document.createElement('div');
        buttons.classList.add('buttons');
        row.appendChild(buttons);

        for(var n = 0; n < items[i].buttons.length; n++) {
            var button = document.createElement('div');
            button.classList.add(items[i].buttons[n] === '$+' ? 'divider': 'button');
            button.textContent = items[i].buttons[n] === '$+' ? '+': items[i].buttons[n];
            buttons.appendChild(button);
        }

        var title = document.createElement('div');
        title.classList.add('title');
        title.textContent = items[i].title;
        row.appendChild(title);

        for(var n = 0; n < items[i].icons.length; n++) {
            var icon = document.createElement('div');
            icon.classList.add('icon');
            icon.innerHTML = items[i].icons[n];
            title.appendChild(icon);
        }

        overlay.append(row);
    }

    root.append(overlay);


    editor.method('help:controls', function() {
        overlay.hidden = false;
    });
});
