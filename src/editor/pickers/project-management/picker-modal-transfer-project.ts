import { Button, Container, Element, Label, Overlay, Panel, TextInput } from '@playcanvas/pcui';

import { config } from '@/editor/config';

const LOOKUP_DELAY = 300;

editor.once('load', () => {
    // GLOBAL VARIABLES
    let currentProject;
    let recipient = null;
    let lookup = 0;
    let timer = null;

    // UI

    // swaps the transfer button's label for a spinner while the request runs
    const toggleLoader = (toggle: boolean) => {
        transferButton.text = toggle ? '' : 'Transfer';

        // setting text replaces the button's children, so put the spinner back
        transferButton.dom.appendChild(loader.dom);
        loader.hidden = !toggle;
    };

    // overlay
    const root = editor.call('layout.root');
    const overlay = new Overlay({
        clickable: false,
        class: 'picker-transfer-project',
        hidden: true
    });
    root.append(overlay);

    // main panel
    const panel = new Panel({
        headerText: 'TRANSFER OWNERSHIP',
        class: 'transfer-project-panel'
    });
    overlay.append(panel);

    // close button
    const btnClose = new Button({
        class: 'close',
        icon: 'E132'
    });
    btnClose.on('click', () => {
        overlay.hidden = true;
    });
    panel.header.append(btnClose);

    const inputContainer = new Container({
        flex: true,
        class: 'form-group'
    });
    panel.append(inputContainer);

    const labelElement = new Label({
        class: 'form-group--label'
    });
    inputContainer.append(labelElement);

    const warning = new Label({
        class: 'form-group--warning',
        text: 'Once they accept, everyone else on the project loses access.'
    });
    inputContainer.append(warning);

    const inputElement = new TextInput({
        class: 'form-group--input',
        placeholder: 'Username'
    });
    inputContainer.append(inputElement);

    // the user the name resolves to, or why it can't be used
    const result = new Container({ class: 'transfer-recipient', hidden: true });
    inputContainer.append(result);
    const avatar = new Element({ dom: 'img', class: 'transfer-recipient-avatar' });
    result.append(avatar);
    const resultText = new Label({ class: 'transfer-recipient-name' });
    result.append(resultText);

    const footer = new Container({ class: 'transfer-project-footer' });
    panel.append(footer);

    const cancelButton = new Button({ class: 'cancel-project-button', text: 'Cancel' });
    cancelButton.on('click', () => {
        overlay.hidden = true;
    });
    footer.append(cancelButton);

    const transferButton = new Button({
        class: 'transfer-project-button',
        text: 'Transfer',
        enabled: false
    });
    footer.append(transferButton);

    const loader = new Element({
        class: 'loader',
        hidden: true
    });
    transferButton.dom.appendChild(loader.dom);

    // CONTROLLERS

    const showResult = (user, message?: string) => {
        result.hidden = !user && !message;
        avatar.hidden = !user;
        if (user) {
            (avatar.dom as HTMLImageElement).src = `${config.url.api}/users/${user.id}/thumbnail?size=32`;
        }
        resultText.text = message ?? (user ? `${user.full_name || user.username} (${user.username})` : '');
        result.class[message ? 'add' : 'remove']('error');
    };

    // resolves the typed username, ignoring answers to older lookups
    const find = (name: string) => {
        const id = ++lookup;
        recipient = null;
        transferButton.enabled = false;
        if (!name) {
            showResult(null);
            return;
        }
        editor.api.globals.rest.users
            .userGet(name.toLowerCase())
            .on('load', (_status, user) => {
                if (id !== lookup) {
                    return;
                }
                if (user.id === currentProject.owner_id) {
                    showResult(user, 'They already own this project');
                    return;
                }
                recipient = user;
                showResult(user);
                transferButton.enabled = true;
            })
            .on('error', () => {
                if (id === lookup) {
                    showResult(null, `No user called ${name}`);
                }
            });
    };

    // native input, so typing and pasting both look the name up
    inputElement.input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => find(inputElement.input.value.trim()), LOOKUP_DELAY);
    });

    transferButton.on('click', () => {
        if (!recipient) {
            return;
        }
        toggleLoader(true);
        transferButton.enabled = false;
        editor.call('projects:transfer', currentProject.id, recipient.id).then(
            () => {
                toggleLoader(false);
                overlay.hidden = true;
                editor.call('picker:project:close');
                editor.call('picker:project:cms:refreshProjects');
            },
            (err) => {
                toggleLoader(false);
                transferButton.enabled = true;
                showResult(null, typeof err === 'string' ? err : 'Could not request the transfer');
            }
        );
    });

    // EVENTS

    // load and show data
    overlay.on('show', () => {
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // clean up
    overlay.on('hide', () => {
        clearTimeout(timer);
        lookup++;
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    // prevent viewport hovering when picker is shown
    editor.on('viewport:hover', (state) => {
        if (state && !overlay.hidden) {
            setTimeout(() => {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // method to display panel
    editor.method('picker:project:modal:transferProject', (project) => {
        currentProject = project;
        recipient = null;
        labelElement.text = `Choose who should own ${project.name}. They'll get a request to accept it.`;
        inputElement.value = '';
        showResult(null);
        transferButton.enabled = false;
        overlay.hidden = false;
        inputElement.focus();
    });
});
