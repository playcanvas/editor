import { Container, Element, Label, TextInput } from '@playcanvas/pcui';

import { config } from '@/editor/config';

import { button } from './components/button';
import { callout } from './components/callout';
import { dialog } from './components/dialog';
import { spinner } from './components/spinner';

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

    const { overlay, panel, footer } = dialog({
        title: 'Transfer ownership',
        class: 'picker-transfer-project',
        size: 'md'
    });

    const inputContainer = new Container({
        flex: true,
        class: 'form-group'
    });
    panel.append(inputContainer);

    const labelElement = new Label({
        class: 'form-group--label'
    });
    inputContainer.append(labelElement);

    const warning = callout({ tone: 'warn', text: 'Once they accept, everyone else on the project loses access.' });
    inputContainer.append(warning);

    const inputElement = new TextInput({
        class: 'form-group--input',
        placeholder: 'Username'
    });
    inputContainer.append(inputElement);

    // a suggestion panel under the field: the user the name resolves to, or why it can't be used
    const result = new Container({ class: 'transfer-recipient', hidden: true });
    inputContainer.append(result);
    const avatar = new Element({ dom: 'img', class: 'transfer-recipient-avatar' });
    result.append(avatar);
    const resultText = new Label({ class: 'transfer-recipient-name' });
    result.append(resultText);
    const resultUser = new Label({ class: 'transfer-recipient-user' });
    result.append(resultUser);

    const cancelButton = button({ kind: 'secondary', text: 'Cancel' });
    cancelButton.on('click', () => {
        overlay.hidden = true;
    });
    footer.append(cancelButton);

    const transferButton = button({ kind: 'primary', text: 'Transfer', enabled: false });
    footer.append(transferButton);

    const loader = spinner({ hidden: true });
    transferButton.dom.appendChild(loader.dom);

    // CONTROLLERS

    const showResult = (user, message?: string) => {
        result.hidden = !user && !message;
        avatar.hidden = !user;
        if (user) {
            (avatar.dom as HTMLImageElement).src = `${config.url.api}/users/${user.id}/thumbnail?size=32`;
        }
        resultText.text = message ?? (user ? user.full_name || user.username : '');
        resultUser.text = !message && user ? user.username : '';
        resultUser.hidden = !resultUser.text;
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
                editor.emit('projects:changed');
            },
            (err) => {
                toggleLoader(false);
                transferButton.enabled = true;
                showResult(null, typeof err === 'string' ? err : 'Could not request the transfer');
            }
        );
    });

    // EVENTS

    // clean up
    overlay.on('hide', () => {
        clearTimeout(timer);
        lookup++;
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
