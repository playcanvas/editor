import { Container, Label, TextInput } from '@playcanvas/pcui';

import { button } from './components/button';
import { dialog } from './components/dialog';
import { spinner } from './components/spinner';

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

    const { overlay, panel, footer } = dialog({ title: 'Delete project', class: 'picker-delete-project', size: 'md' });

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

    const cancelButton = button({ kind: 'secondary', text: 'Cancel' });
    cancelButton.on('click', () => {
        overlay.hidden = true;
    });
    footer.append(cancelButton);

    const deleteButton = button({ kind: 'danger', text: 'Delete project', enabled: false });
    footer.append(deleteButton);

    const loader = spinner({ hidden: true });
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
