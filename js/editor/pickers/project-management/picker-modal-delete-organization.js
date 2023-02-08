import { Panel, Button, Container, Label, TextInput } from '@playcanvas/pcui';

editor.once('load', () => {

    // GLOBAL VARIABLES
    let rootUser;
    let organization;
    let organizationProjects;

    // UI

    // overlay
    const root = editor.call('layout.root');
    const overlay = new ui.Overlay();
    overlay.clickable = false;
    overlay.hidden = true;
    overlay.class.add('picker-delete-organization');
    root.append(overlay);

    // main panel
    const panel = new Panel({
        headerText: 'DELETE ORGANIZATION',
        class: 'delete-organization-panel'
    });
    overlay.append(panel);

    // close button
    var btnClose = new Button({
        class: 'close',
        icon: 'E132'
    });
    btnClose.on('click', function () {
        overlay.hidden = true;
    });
    panel.header.append(btnClose);

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
    const projectsWarning = new Label({
        class: 'form-group--warning',
        text: 'WARNING: This organization contains projects. If you decide to go ahead, these will be transferred to your account.'
    });
    container.append(projectsWarning);

    const inputElement = new TextInput({
        class: 'form-group--input',
        keyChange: true
    });
    container.append(inputElement);

    panel.append(container);

    inputElement.on('change', () => { validateInput(); });
    inputElement.dom.addEventListener('paste', e => e.preventDefault());

    // delete button

    const deleteButton = new Button({
        class: 'delete-org-button',
        text: 'DELETE',
        enabled: false,  // create button disabled on load
        renderChanges: true
    });
    panel.append(deleteButton);

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
        editor.call('users:deleteOne', organization.id, (response) => {
            editor.call('picker:project:cms:refreshOrgs', organization, true);
            editor.call('picker:project:cms:resetFilter');
            overlay.hidden = true;
        }, (err) => {
            editor.call('picker:project:buildAlert', editor.call('picker:project:cms:getPanel'), err);
        });
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
    editor.method('picker:project:deleteOrganization', (projects) => {
        rootUser = editor.call('picker:project:cms:rootUser');
        organization = editor.call('picker:project:cms:dropdownOrg');
        organizationProjects = projects;
        labelElement.text = `Type the organization name, "${organization.full_name}" in the text box to delete this organization permanently. This action cannot be undone!`;
        projectsWarning.element.style.display = organizationProjects.length === 0 ? 'none' : 'block';
        overlay.hidden = false;
    });
});
