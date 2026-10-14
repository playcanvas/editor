import { Button, Container, Element, Label, Overlay, Panel, TextInput } from '@playcanvas/pcui';

editor.once('load', () => {
    // GLOBAL VARIABLES
    let currentProject;

    // UI

    // swaps the delete button's label for a spinner while the request runs
    const toggleLoader = (toggle: boolean) => {
        deleteButton.text = toggle ? '' : 'Delete project';

        // setting text replaces the button's children, so put the spinner back
        deleteButton.dom.appendChild(loader.dom);
        loader.hidden = !toggle;
    };

    // overlay
    const root = editor.call('layout.root');
    const overlay = new Overlay({
        clickable: false,
        class: 'picker-delete-project',
        hidden: true
    });
    root.append(overlay);

    // main panel
    const panel = new Panel({
        headerText: 'DELETE PROJECT',
        class: 'delete-project-panel'
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

    const inputElement = new TextInput({
        class: 'form-group--input',
        keyChange: true
    });
    inputContainer.append(inputElement);

    inputElement.on('change', () => {
        validateInput(inputElement.value);
    });
    inputElement.dom.addEventListener('paste', (e) => e.preventDefault());

    const footer = new Container({ class: 'delete-project-footer' });
    panel.append(footer);

    const cancelButton = new Button({ class: 'cancel-project-button', text: 'Cancel' });
    cancelButton.on('click', () => {
        overlay.hidden = true;
    });
    footer.append(cancelButton);

    const deleteButton = new Button({
        class: 'delete-project-button',
        text: 'Delete project',
        enabled: false
    });
    footer.append(deleteButton);

    const loader = new Element({
        class: 'loader',
        hidden: true
    });
    deleteButton.dom.appendChild(loader.dom);

    deleteButton.on('click', () => {
        toggleLoader(true);
        // delete project from database
        editor.call('projects:delete', currentProject.id, () => {
            toggleLoader(false);
            overlay.hidden = true;
            editor.call('picker:project:close');
            editor.call('picker:project:cms:toggleProgress', true);
        });
        inputElement.value = ''; // reset input
    });

    // CONTROLLERS

    // determines whether the input matches the project title and therefore delete button can be enabled
    const validateInput = (userInput) => {
        deleteButton.enabled = userInput === currentProject.name;
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
    editor.method('picker:project:modal:deleteProjectConfirmation', (project) => {
        currentProject = project;
        labelElement.text = `This permanently deletes ${currentProject.name} and can't be undone. Type its name to confirm.`;
        inputElement.value = '';
        inputElement.input.placeholder = currentProject.name;
        deleteButton.enabled = false;
        overlay.hidden = false;
    });
});
