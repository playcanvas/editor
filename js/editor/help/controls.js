import { Overlay, Container, Label, Button } from '@playcanvas/pcui';

editor.once('load', function () {
    'use strict';

    const root = editor.call('layout.root');

    const overlay = new Overlay({
        class: 'help-controls',
        clickable: true,
        hidden: true
    });

    overlay.element.addEventListener('mousewheel', function (evt) {
        evt.stopPropagation();
    }, { passive: true });

    // header
    const header = new Container({
        class: 'header'
    });
    overlay.append(header);

    const title = new Label({
        text: 'CONTROLS'
    });
    header.append(title);

    // close
    const btnClose = new Button({
        icon: 'E132'
    });
    btnClose.on('click', function () {
        overlay.hidden = true;
    });
    header.append(btnClose);

    // top image
    const imgTop = new Image();
    imgTop.src = 'https://playcanvas.com/static-assets/images/help-controls.png';
    imgTop.classList.add('top');
    imgTop.draggable = false;
    overlay.append(imgTop);

    const container = new Container({
        class: 'container'
    });
    overlay.append(container);

    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    const items = [
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
            icons: ['&#57895;']
        }, {
            buttons: ['F'],
            title: 'Focus on Entity',
            icons: ['&#58120;']
        }, {
            buttons: ['Shift', '$+', 'Z'],
            title: 'Previous Selection',
            icons: ['&#57671;']
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

    for (let i = 0; i < items.length; i++) {
        const row = document.createElement('div');
        row.classList.add('row');

        const buttons = document.createElement('div');
        buttons.classList.add('buttons');
        row.appendChild(buttons);

        for (let n = 0; n < items[i].buttons.length; n++) {
            const button = document.createElement('div');
            const divider = items[i].buttons[n].startsWith('$');
            let sign = '';
            if (divider) sign = items[i].buttons[n].slice(1);

            button.classList.add(divider ? 'divider' : 'button');
            if (sign === '+') button.classList.add('plus');
            if (sign === '/') button.classList.add('or');

            button.textContent = divider ? sign : items[i].buttons[n];
            buttons.appendChild(button);
        }

        const title = document.createElement('div');
        title.classList.add('title');
        title.textContent = items[i].title;
        row.appendChild(title);

        for (let n = 0; n < items[i].icons.length; n++) {
            const icon = document.createElement('div');
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

    const onKey = function (e) {
        if (e.keyCode === 27) {
            overlay.hidden = true;
        }
    };

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

    // hotkey
    editor.call('hotkey:register', 'help:controls', {
        key: 'forward slash',
        shift: true,
        callback: function () {
            editor.call('help:controls');
        }
    });
});
