editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');

    var overlay = new ui.Overlay();
    overlay.class.add('help-controls');
    overlay.style.zIndex = 203;
    overlay.center = true;
    overlay.hidden = true;

    overlay.element.addEventListener('mousewheel', function (evt) {
        evt.stopPropagation();
    }, { passive: true });

    // header
    var header = new ui.Label({
        unsafe: true,
        text: '<span class="icon">&#57654;</span>Controls'
    });
    header.class.add('header');
    overlay.append(header);

    // close
    var btnClose = new ui.Button();
    btnClose.class.add('close');
    btnClose.text = '&#57650;';
    btnClose.on('click', function () {
        overlay.hidden = true;
    });
    header.element.appendChild(btnClose.element);

    // top image
    var imgTop = new Image();
    imgTop.src = 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/images/help-controls.png';
    imgTop.classList.add('top');
    imgTop.draggable = false;
    overlay.append(imgTop);

    var container = new ui.Panel();
    container.class.add('container');
    overlay.append(container);

    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    var items = [
        {
            buttons: ['Ctrl', '$+', 'Enter'],
            title: 'Launch',
            icons: ['&#57649;']
        }, {
            buttons: ['Ctrl', '$+', 'E'],
            title: 'New Entity',
            icons: ['&#57632;']
        }, {
            buttons: ['Ctrl', '$+', 'C'],
            title: 'Copy Entity / Asset',
            icons: ['&#58193;']
        }, {
            buttons: ['Ctrl', '$+', 'V'],
            title: 'Paste Entity / Asset',
            icons: ['&#58184;']
        }, {
            buttons: ['Ctrl', '$+', 'Shift', '$+', 'V'],
            title: 'Paste Assets (keep folder structure)',
            icons: ['&#58184;']
        }, {
            buttons: ['Delete', '$/', 'Ctrl', '$+', 'Backspace'],
            title: 'Delete Selected',
            icons: ['&#57636;']
        }, {
            buttons: ['Ctrl', '$+', 'D'],
            title: 'Duplicate Entity',
            icons: ['&#57638;']
        }, {
            buttons: ['N', '$/', 'F2'],
            title: 'Rename Entity / Asset',
            icons: ['&#57895;'],
        }, {
            buttons: ['F'],
            title: 'Focus on Entity',
            icons: ['&#58120;'],
        }, {
            buttons: ['Shift', '$+', 'Z'],
            title: 'Previous Selection',
            icons: ['&#57671;'],
        }, {
            buttons: ['Ctrl', '$+', 'Z'],
            title: 'Undo',
            icons: ['&#57620;']
        }, {
            buttons: ['Ctrl', '$+', 'Y', '$/', 'Ctrl', '$+', 'Shift', '$+', 'Z'],
            title: 'Redo',
            icons: ['&#57621;']
        }, {
            buttons: ['Ctrl', '$+', 'B'],
            title: 'Bake / Recalculate Lights',
            icons: ['&#57745;']
        }, {
            buttons: ['Space'],
            title: 'Toggle All Panels',
            icons: ['&#57639;']
        }, {
            buttons: ['1', '2', '3'],
            title: 'Translate / Rotate / Scale Gizmo',
            icons: ['&#57618;', '&#57619;', '&#57617;']
        }, {
            buttons: ['L'],
            title: 'Toggle space: World / Local ',
            icons: ['&#57879;']
        }, {
            buttons: ['Shift', '$+', '?'],
            title: 'Controls',
            icons: ['&#57654;']
        }, {
            buttons: ['Alt', '$+', 'A'],
            title: 'Focus on Assets Search Field',
            icons: ['&#57641;']
        }, {
            buttons: ['Ctrl', '$+', 'Space'],
            title: 'How do I...?',
            icons: ['&#57656;']
        }
    ];

    if (!legacyScripts) {
        items.push({
            buttons: ['Ctrl', '$+', 'I'],
            title: 'Open Code Editor',
            icons: ['&#57648;']
        });

        items.push({
            buttons: ['Ctrl', '$+', 'S'],
            title: 'New Checkpoint',
            icons: ['&#58265;']
        });
    }

    for (var i = 0; i < items.length; i++) {
        var row = document.createElement('div');
        row.classList.add('row');

        var buttons = document.createElement('div');
        buttons.classList.add('buttons');
        row.appendChild(buttons);

        for (var n = 0; n < items[i].buttons.length; n++) {
            var button = document.createElement('div');
            var divider = items[i].buttons[n].startsWith('$');
            var sign = '';
            if (divider) sign = items[i].buttons[n].slice(1);

            button.classList.add(divider ? 'divider' : 'button');
            if (sign === '+') button.classList.add('plus');
            if (sign === '/') button.classList.add('or');

            button.textContent = divider ? sign : items[i].buttons[n];
            buttons.appendChild(button);
        }

        var title = document.createElement('div');
        title.classList.add('title');
        title.textContent = items[i].title;
        row.appendChild(title);

        for (var n = 0; n < items[i].icons.length; n++) {
            var icon = document.createElement('div');
            icon.classList.add('icon');
            icon.innerHTML = items[i].icons[n];
            title.appendChild(icon);
        }

        container.append(row);
    }

    root.append(overlay);


    editor.method('help:controls', function () {
        overlay.hidden = false;
    });

    overlay.on('show', function () {
        editor.emit('help:controls:open');
        window.addEventListener('keydown', onKey);

        editor.emit('picker:open', 'controls');
    });

    overlay.on('hide', function () {
        editor.emit('help:controls:close');
        window.removeEventListener('keydown', onKey);

        editor.emit('picker:close', 'controls');
    });

    var onKey = function (e) {
        if (e.keyCode === 27) {
            overlay.hidden = true;
        }
    };

    // hotkey
    editor.call('hotkey:register', 'help:controls', {
        key: 'forward slash',
        shift: true,
        callback: function () {
            editor.call('help:controls');
        }
    });
});
