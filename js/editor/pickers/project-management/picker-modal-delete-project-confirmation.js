editor.once('load', () => {

    // GLOBAL VARIABLES
    let currentProject;

    // UI

    // displays or hides the AJAX loader in project delete button
    const toggleLoader = (toggle) => {
        if (toggle) {
            deleteButton.text = '';
            loader.dom.style.display = 'block';
        } else {
            loader.dom.style.display = 'none';
            deleteButton.text = 'DELETE';
        }
    };

    // overlay
    const root = editor.call('layout.root');
    const overlay = new ui.Overlay();
    overlay.clickable = false;
    overlay.hidden = true;
    overlay.class.add('picker-delete-project');
    root.append(overlay);

    // main panel
    const panel = new pcui.Panel({
        headerText: 'DELETE PROJECT',
        class: 'delete-project-panel'
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

    const inputContainer = new pcui.Container({
        flex: true,
        class: 'form-group'
    });
    panel.append(inputContainer);

    const labelElement = new pcui.Label({
        class: 'form-group--label'
    });
    inputContainer.append(labelElement);

    const inputElement = new pcui.TextInput({
        class: 'form-group--input',
        keyChange: true
    });
    inputContainer.append(inputElement);

    inputElement.on('change', () => { validateInput(inputElement.value); });
    inputElement.dom.addEventListener('paste', e => e.preventDefault());

    const deleteButtonContainer = new pcui.Container({
        flex: true
    });
    panel.append(deleteButtonContainer);

    const deleteButton = new pcui.Button({
        class: 'delete-project-button',
        text: 'DELETE',
        enabled: false,  // create button disabled on load
        renderChanges: true
    });
    deleteButtonContainer.append(deleteButton);

    const loader = new pcui.Element({
        class: ['loader', 'small', 'white']
    });
    loader.dom.style.display = 'none';

    deleteButtonContainer.append(loader);

    deleteButton.on('click', () => {
        toggleLoader(true);
        // delete project from database
        editor.call('projects:delete', currentProject.id, () => {
            toggleLoader(false);
            overlay.hidden = true;
            editor.call('picker:project:close');
            editor.call('picker:project:cms:toggleProgress', true);
        });
        inputElement.value = '';  // reset input
    });


    // CONTROLLERS

    // determines whether the input matches the project title and therefore delete button can be enabled
    const validateInput = (userInput) => {
        deleteButton.enabled = userInput === currentProject.name;
    };

    // EVENTS

    // load and show data
    overlay.on('show', () => {
        if (editor.call('viewport:inViewport')) editor.emit('viewport:hover', false);
    });

    // clean up
    overlay.on('hide', () => {
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
    editor.method('picker:project:modal:deleteProjectConfirmation', (project) => {
        currentProject = project;
        labelElement.text = `Type the project name (${currentProject.name}) to delete this project permanently. This action cannot be undone!`;
        overlay.hidden = false;
    });
});
