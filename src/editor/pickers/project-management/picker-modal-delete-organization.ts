import { Container, Label, TextInput } from '@playcanvas/pcui';

import { button } from './components/button';
import { callout } from './components/callout';
import { dialog } from './components/dialog';

editor.once('load', () => {
    // GLOBAL VARIABLES
    let rootUser;
    let organization;
    let organizationProjects;

    // UI

    const { overlay, panel, footer } = dialog({
        title: 'Delete organization',
        class: 'picker-delete-organization',
        size: 'md'
    });

    // input

    const container = new Container({
        flex: true,
        class: 'form-group'
    });
    panel.append(container);

    const labelElement = new Label({
        class: 'form-group--label'
    });
    container.append(labelElement);

    // conditionally display information about containing projects
    const projectsWarning = callout({
        tone: 'warn',
        text: 'This organization has projects. Deleting it transfers them to your account.'
    });
    container.append(projectsWarning);

    const inputElement = new TextInput({
        class: 'form-group--input',
        keyChange: true
    });
    container.append(inputElement);

    inputElement.on('change', () => {
        validateInput();
    });
    inputElement.dom.addEventListener('paste', (e) => e.preventDefault());

    // delete button

    const cancelButton = button({ kind: 'secondary', text: 'Cancel' });
    cancelButton.on('click', () => {
        overlay.hidden = true;
    });
    footer.append(cancelButton);

    const deleteButton = button({ kind: 'danger', text: 'Delete organization', enabled: false });
    footer.append(deleteButton);

    deleteButton.on('click', () => {
        // If organization contains projects, make sure to transfer them to root user before deleting account
        if (organizationProjects.length > 0) {
            const promises = [];
            const projectIds = [];
            organizationProjects.forEach((project) => {
                projectIds.push(project.id);
                promises.push(editor.call('projects:transfer', project.id, rootUser.id));
            });

            Promise.all(promises).then(() => {
                // automatically accept all transferred projects before deleting organization
                acceptAllTransfersAndDelete(projectIds);
            });
        } else {
            deleteOrganization();
        }
    });

    // CONTROLLERS

    // controller to detect whether input is valid and therefore delete button should be displayed or not
    const validateInput = () => {
        deleteButton.enabled = organization.full_name === inputElement.value;
    };

    // method to transfer all organization projects to current user on deleting org with projects
    const acceptAllTransfersAndDelete = (projectIds) => {
        const promises = [];
        projectIds.forEach((id) => {
            promises.push(editor.call('projects:acceptTransfer', id));
        });

        Promise.all(promises).then(() => {
            deleteOrganization();
        });
    };

    // controller that handles the deletion of organizations as well as relevant error states
    const deleteOrganization = () => {
        editor.call(
            'users:deleteOne',
            organization.id,
            () => {
                editor.call('picker:project:cms:refreshOrgs', organization, true);
                editor.call('picker:project:cms:resetFilter');
                overlay.hidden = true;
            },
            (err) => {
                editor.call('picker:project:buildAlert', editor.call('picker:project:cms:getPanel'), err);
            }
        );
    };

    // EVENTS

    // clean up
    overlay.on('hide', () => {
        editor.call('picker:project:hideAlerts');
    });

    // method to display panel
    editor.method('picker:project:deleteOrganization', (projects) => {
        rootUser = editor.call('picker:project:cms:rootUser');
        organization = editor.call('picker:project:cms:dropdownOrg');
        organizationProjects = projects;
        labelElement.text = `This permanently deletes ${organization.full_name}. Type its name to confirm.`;
        inputElement.value = '';
        inputElement.input.placeholder = organization.full_name;
        projectsWarning.hidden = organizationProjects.length === 0;
        overlay.hidden = false;
    });
});
