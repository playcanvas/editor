editor.once('load', () => {

    // GLOBAL VARIABLES
    let currentUser;

    // UI

    // renders a single input UI in the new project form (text input or textarea)
    const buildFormGroup = (label, hint = null) => {
        const container = new pcui.Container({
            flex: true,
            class: 'form-group'
        });
        panel.append(container);

        const labelElement = new pcui.Label({
            text: label,
            class: 'form-group--label'
        });
        container.append(labelElement);

        const inputElement = new pcui.TextInput({
            class: 'form-group--input',
            keyChange: true
        });
        container.append(inputElement);

        if (hint) {
            const hintElement = new pcui.Label({
                class: 'form-group--hint',
                text: hint
            });
            container.append(hintElement);
        }

        return inputElement;
    };

    // overlay
    const root = editor.call('layout.root');
    const overlay = new ui.Overlay();
    overlay.clickable = false;
    overlay.hidden = true;
    overlay.class.add('picker-new-organization');
    root.append(overlay);

    // main panel
    const panel = new pcui.Panel({
        headerText: 'NEW ORGANIZATION',
        class: 'new-organization-panel'
    });
    overlay.append(panel);

    // close button
    const btnClose = new pcui.Button({
        class: 'close',
        icon: 'E132'
    });
    btnClose.on('click', function () {
        overlay.hidden = true;
    });
    panel.header.append(btnClose);

    const orgNameInput = buildFormGroup('Organization Name', 'e.g. PlayCanvas Ltd');
    const orgIdInput = buildFormGroup('Organization ID', 'Your organization will be available at https://playcanvas.com/<organization-id>');
    const orgEmailInput = buildFormGroup('Email');

    orgNameInput.on('change', () => { validateInputs(); });
    orgIdInput.on('change', () => { validateInputs(); });
    orgEmailInput.on('change', () => { validateInputs(); });

    const createButton = new pcui.Button({
        class: 'create-org-button',
        text: 'CREATE',
        enabled: false,  // create button disabled on load
        renderChanges: true
    });
    panel.append(createButton);

    createButton.on('click', () => {
        const newOrganization = {
            full_name: orgNameInput.value,
            username: orgIdInput.value,
            email: orgEmailInput.value,
            organization: true
        };
        editor.call('users:createOne', newOrganization, (newUser) => {
            editor.call('picker:project:cms:refreshOrgs', newUser);
            overlay.hidden = true;
        }, (err) => {
            editor.call('picker:project:buildAlert', overlay, err);
        });
    });


    // CONTROLLERS

    // determines whether inputs match expected and therefore create button should be enabled
    const validateInputs = () => {
        const isNameValid = orgNameInput.value.length > 0;
        const isIdValid = orgIdInput.value.length > 0 && !/\s/.test(orgIdInput.value);
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orgEmailInput.value) && orgEmailInput.value.length > 0;

        createButton.enabled = isNameValid && isIdValid && isEmailValid;
    };

    // EVENTS

    // load and show data
    overlay.on('show', () => {
        if (editor.call('viewport:inViewport')) editor.emit('viewport:hover', false);
    });

    // clean up
    overlay.on('hide', () => {
        editor.call('picker:project:hideAlerts');
        if (editor.call('viewport:inViewport')) editor.emit('viewport:hover', true);
    });

    // prevent viewport hovering when picker is shown
    editor.on('viewport:hover', function (state) {
        if (state && !overlay.hidden) {
            setTimeout(function () {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // method to display panel
    editor.method('picker:project:newOrganization', () => {
        currentUser = editor.call('picker:project:cms:currentUser');
        orgEmailInput.value = currentUser.email;  // set email field to current user's email
        overlay.hidden = false;
    });
});
