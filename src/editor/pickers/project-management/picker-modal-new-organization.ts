import { Button, Container, Label, Overlay, Panel, TextInput } from '@playcanvas/pcui';

import { config } from '@/editor/config';

editor.once('load', () => {
    // GLOBAL VARIABLES
    let currentUser;

    // UI

    // form field: label, input (optionally behind a fixed prefix) and a hint that only shows on errors
    const buildField = (label, placeholder, prefix = null) => {
        const group = new Container({ class: 'form-group' });
        panel.append(group);
        group.append(new Label({ text: label, class: 'form-group--label' }));

        const field = new Container({ class: 'form-group--field' });
        group.append(field);
        if (prefix) {
            field.append(new Label({ text: prefix, class: 'form-group--prefix' }));
        }
        const input = new TextInput({ class: 'form-group--input', keyChange: true });
        input.input.placeholder = placeholder;
        field.append(input);

        const hint = new Label({ class: 'form-group--hint', hidden: true });
        group.append(hint);
        return { input, field, hint };
    };

    // overlay
    const root = editor.call('layout.root');
    const overlay = new Overlay({
        clickable: false,
        class: 'picker-new-organization',
        hidden: true
    });
    root.append(overlay);

    // main panel
    const panel = new Panel({
        headerText: 'NEW ORGANIZATION',
        class: 'new-organization-panel'
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

    // live preview of how the organization will appear
    const preview = new Container({ class: 'new-organization-preview' });
    panel.append(preview);
    const previewTile = new Label({ class: 'preview-tile' });
    preview.append(previewTile);
    const previewText = new Container({ class: 'preview-text' });
    preview.append(previewText);
    const previewName = new Label({ class: 'preview-name' });
    previewText.append(previewName);
    const previewUrl = new Label({ class: 'preview-url' });
    previewText.append(previewUrl);

    const host = `${config.url.home.replace(/^https?:\/\//, '')}/`;
    const name = buildField('Name', 'e.g. PlayCanvas Ltd');
    const id = buildField('URL', 'organization-id', host);
    const email = buildField('Billing email', 'name@company.com');
    const orgNameInput = name.input;
    const orgIdInput = id.input;
    const orgEmailInput = email.input;

    // the url follows the name until it's edited by hand
    let idEdited = false;
    const slug = (value) =>
        value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

    orgNameInput.on('change', () => {
        if (!idEdited) {
            orgIdInput.value = slug(orgNameInput.value);
        }
        validateInputs();
    });
    orgIdInput.input.addEventListener('input', () => {
        idEdited = orgIdInput.value.length > 0;
    });
    orgIdInput.on('change', () => {
        validateInputs();
    });
    orgEmailInput.on('change', () => {
        validateInputs();
    });

    const footer = new Container({ class: 'new-organization-footer' });
    panel.append(footer);

    const cancelButton = new Button({ class: 'cancel-org-button', text: 'Cancel' });
    cancelButton.on('click', () => {
        overlay.hidden = true;
    });
    footer.append(cancelButton);

    const createButton = new Button({
        class: 'create-org-button',
        text: 'Create organization',
        enabled: false
    });
    footer.append(createButton);

    createButton.on('click', () => {
        const newOrganization = {
            full_name: orgNameInput.value,
            username: orgIdInput.value,
            email: orgEmailInput.value,
            organization: true
        };
        editor.call(
            'users:createOne',
            newOrganization,
            (newUser) => {
                editor.call('picker:project:cms:refreshOrgs', newUser);
                overlay.hidden = true;
            },
            (err) => {
                editor.call('picker:project:buildAlert', overlay, err);
            }
        );
    });

    // CONTROLLERS

    const showHint = (field, message) => {
        field.hint.text = message ?? '';
        field.hint.hidden = !message;
        field.field.class[message ? 'add' : 'remove']('invalid');
    };

    // enables create once every field is valid; hints only show for values that need fixing
    const validateInputs = () => {
        const isNameValid = orgNameInput.value.length > 0;
        const isIdValid = orgIdInput.value.length > 0 && !/\s/.test(orgIdInput.value);
        const isEmailValid =
            /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(orgEmailInput.value) && orgEmailInput.value.length > 0;

        showHint(id, orgIdInput.value && !isIdValid ? "The URL can't contain spaces." : null);
        showHint(email, orgEmailInput.value && !isEmailValid ? 'Enter a valid email address.' : null);

        const initials = orgNameInput.value
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0].toUpperCase())
            .join('');
        previewTile.text = initials || '?';
        previewName.text = orgNameInput.value || 'New organization';
        previewUrl.text = `${host}${orgIdInput.value || 'organization-id'}`;
        preview.class[isNameValid ? 'remove' : 'add']('empty');

        createButton.enabled = isNameValid && isIdValid && isEmailValid;
    };

    // EVENTS

    // load and show data
    overlay.on('show', () => {
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // clean up
    overlay.on('hide', () => {
        editor.call('picker:project:hideAlerts');
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
    editor.method('picker:project:newOrganization', () => {
        currentUser = editor.call('picker:project:cms:currentUser');
        orgNameInput.value = '';
        orgIdInput.value = '';
        idEdited = false;
        orgEmailInput.value = currentUser.email; // set email field to current user's email
        validateInputs();
        overlay.hidden = false;
    });
});
