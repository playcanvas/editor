import { Overlay, Button, Container } from '@playcanvas/pcui';

import { createSpinner } from '@/common/utils';

editor.once('load', () => {
    let callback = null;

    // overlay
    const overlay = new Overlay({
        class: 'picker-confirm',
        hidden: true
    });

    // container
    const container = new Container({
        class: 'picker-engine-container'
    });
    overlay.append(container);

    // cancel
    const btnCancel = new Button({
        class: 'cancel',
        text: 'Cancel'
    });
    btnCancel.on('click', () => {
        overlay.hidden = true;
    });
    overlay.append(btnCancel);

    // action
    const btnAction = new Button({
        class: 'action',
        text: 'Action'
    });
    btnAction.on('click', () => {
        if (callback) {
            callback();
        }
        overlay.hidden = true;
    });
    overlay.append(btnAction);

    const root = editor.call('layout.root');
    root.append(overlay);

    const keyDown = (evt) => {
        if (overlay.hidden) {
            return;
        }

        evt.preventDefault();
        evt.stopPropagation();

        if (evt.key === 'Escape') {
            btnCancel.emit('click');
        } else if (evt.key === 'Enter') { // click focused button
            if (document.activeElement === btnCancel.element) {
                if (!btnCancel.disabled) {
                    btnCancel.emit('click');
                }
            } else if (!btnAction.disabled) {
                btnAction.emit('click');
            }
        } else if (evt.key === 'Tab') { // focus yes / no buttons
            if (document.activeElement === btnCancel.element) {
                btnAction.element.focus();
            } else {
                btnCancel.element.focus();
            }
        } else if (evt.key === 'ArrowRight') { // focus right button (Yes)
            btnAction.element.focus();
        } else if (evt.key === 'ArrowLeft') { // focus left button (No)
            btnCancel.element.focus();
        }
    };

    overlay.on('show', () => {
        editor.emit('picker:engine:open');
        // editor-blocking picker open
        editor.emit('picker:open', 'engine');

        window.addEventListener('keydown', keyDown, true);
    });

    // on overlay hide
    overlay.on('hide', () => {
        editor.emit('picker:engine:close');
        // editor-blocking picker closed
        editor.emit('picker:close', 'engine');

        window.removeEventListener('keydown', keyDown, true);
    });

    const switchRemoteContainer = (engineV2) => {
        const root = document.createElement('div');
        root.id = 'switch-engine';
        root.classList.add('remote');

        const title = document.createElement('div');
        title.classList.add('title');
        title.textContent = `Switching project to Engine V${engineV2 ? '2' : '1'}. Reloading page...`;
        root.appendChild(title);

        const spinner = document.createElement('div');
        spinner.classList.add('spinner');
        spinner.appendChild(createSpinner(32));
        root.appendChild(spinner);

        return root;
    };

    const switchLocalContainer = (engineV2) => {
        const createHeader = (text) => {
            const header = document.createElement('div');
            header.classList.add('header');
            header.textContent = text;
            return header;
        };

        const createBullet = (text) => {
            const bullet = document.createElement('div');
            bullet.textContent = `• ${text}`;
            return bullet;
        };

        const createLink = ({ name, url }) => {
            const div = document.createElement('div');

            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.textContent = `• ${name}`;
            div.appendChild(link);

            return div;
        };

        const root = document.createElement('div');
        root.id = 'switch-engine';
        root.classList.add('local');

        const title = document.createElement('div');
        title.classList.add('title');
        title.textContent = `Switch to Engine V${engineV2 ? '2' : '1'}?`;
        root.appendChild(title);

        root.appendChild(createHeader('Engine V1'));

        const changesV1 = document.createElement('div');
        changesV1.classList.add('changes');
        root.appendChild(changesV1);
        changesV1.appendChild(createBullet('WebGL 2.0 & 1.0 support'));
        changesV1.appendChild(createBullet('No new features and improvements'));
        changesV1.appendChild(createBullet('Legacy Script support'));
        changesV1.appendChild(createBullet('AudioComponent support'));

        root.appendChild(createHeader('Engine V2'));

        const changesV2 = document.createElement('div');
        changesV2.classList.add('changes');
        root.appendChild(changesV2);
        changesV2.appendChild(createBullet('WebGL 2.0 & WebGPU support'));
        changesV2.appendChild(createBullet('Regular new features and improvements'));

        root.appendChild(document.createElement('br'));

        const headerInfo = document.createElement('div');
        headerInfo.textContent = 'The switch will likely necessitate script modifications to ensure compatibility with the selected engine version. For more details, refer to the provided links.';
        root.appendChild(headerInfo);

        const links = document.createElement('div');
        links.classList.add('links');
        root.appendChild(links);
        links.appendChild(createLink({
            name: 'Engine Compatibility',
            url: 'https://developer.playcanvas.com/user-manual/editor/engine-compatibility/'
        }));
        links.appendChild(createLink({
            name: 'Engine Migrations',
            url: 'https://developer.playcanvas.com/user-manual/engine/migrations/'
        }));
        links.appendChild(createLink({
            name: 'Editor Migrations',
            url: 'https://developer.playcanvas.com/user-manual/editor/editor-migrations/'
        }));

        root.appendChild(document.createElement('br'));

        const note = document.createElement('div');
        note.classList.add('note');
        note.textContent = 'Note: This will reload the editor for all users on this branch.';
        root.appendChild(note);

        return root;
    };

    // call picker
    editor.method('picker:engine', (remote, engineV2, fn) => {
        if (remote) {
            container.clear();
            container.append(switchRemoteContainer(engineV2));

            btnAction.hidden = false;
            btnAction.text = 'OK';

            btnCancel.hidden = true;

            overlay.clickable = false;
        } else {
            container.clear();
            container.append(switchLocalContainer(engineV2));

            btnAction.hidden = false;
            btnAction.text = 'Switch';

            btnCancel.hidden = false;
            btnCancel.text = 'Cancel';

            overlay.clickable = true;
        }

        // save callback
        callback = fn || null;

        // show overlay
        overlay.hidden = false;
    });

    // close picker
    editor.method('picker:engine:close', () => {
        overlay.hidden = true;
    });
});
