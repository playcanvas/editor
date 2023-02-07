editor.once('load', () => {
    // global variables
    let initialLoad = true;
    let projectSettingsChanged = false;
    let events = [];  // holds events that need to be destroyed
    const IS_EMPTY_STATE = !config.project.id;
    let currentProject = IS_EMPTY_STATE ? null : config.project;
    let projectSettings = {
        id: IS_EMPTY_STATE ? -1 : currentProject.id,
        name: IS_EMPTY_STATE ? '' : currentProject.name,
        description: IS_EMPTY_STATE ? '' : currentProject.description,
        private: IS_EMPTY_STATE ? false : currentProject.private
    };
    let panelName = IS_EMPTY_STATE ? '' : currentProject.name.toUpperCase();

    // UI

    // displays or hides the AJAX loader UI when exporting project
    const toggleLoader = (toggle) => {
        if (toggle) {
            exportProjectButton.text = '';
            exportProjectButton.dom.setAttribute('data-icon', '');
            loader.dom.style.display = 'block';
        } else {
            loader.dom.style.display = 'none';
            exportProjectButton.text = 'EXPORT PROJECT';
            exportProjectButton.icon = 'E228';
        }
    };

    // helper method to determine whether the current user is an admin
    const isAdmin = () => {
        return currentProject ? currentProject.access_level === 'admin' : false;
    };

    // main panel
    const panel = new pcui.Container({
        class: 'picker-project-main'
    });

    // register panel with project popup
    editor.call('picker:project:registerMenu', 'project-main', 'PROJECT SETTINGS', panel, panelName);

    // hide button if the user doesn't have the right permissions
    if (!editor.call('permissions:read')) {
        editor.call('picker:project:toggleMenu', 'project-main', false);
    }

    // if the user permissions change, then change the visibility of the button
    editor.on('permissions:set', function () {
        editor.call('picker:project:toggleMenu', 'project-main', editor.call('permissions:read'));
    });

    // locked UI
    const lockedContainer = new pcui.Container({
        class: 'locked-container',
        flex: true
    });
    panel.append(lockedContainer);

    const lockedText = new pcui.Label({
        class: 'locked-text'
    });
    lockedText.dom.innerHTML = `This project is locked. Unlocking this project will make it public. Another way of unlocking is to <a href="${config.url.home}/upgrade" target="_blank">UPGRADE</a>`;
    lockedContainer.append(lockedText);

    const unlockButton = new pcui.Button({
        icon: 'E340',
        text: 'UNLOCK'
    });
    lockedContainer.append(unlockButton);
    lockedContainer.element.style.display = 'none';  // hide by default

    unlockButton.on('click', () => {
        editor.call('projects:unlockOne', currentProject.id, () => {
            editor.call('picker:project:cms:refreshProjects');
            editor.call('picker:project:close');
        }, (err) => {
            editor.call('picker:project:buildAlert', panel, err);
        });
    });

    // project settings container
    const settingsContainer = new pcui.Container({
        class: 'project-settings',
        flex: true
    });
    panel.append(settingsContainer);

    // project name group
    const projectNameGroup = new pcui.Container({
        flex: true,
        class: 'settings-group'
    });
    settingsContainer.append(projectNameGroup);

    const projectNameLabel = new pcui.Label({
        text: 'Name'
    });
    projectNameGroup.append(projectNameLabel.element);
    const projectNameInput = new pcui.TextInput({
        enabled: isAdmin(),
        class: 'form-input',
        value: projectSettings.name,
        renderChanges: true,
        keyChange: true
    });
    projectNameGroup.append(projectNameInput.element);

    projectNameInput.on('change', () => {
        const newValue = projectNameInput.value;
        if (projectNameInput.value.length > 32) projectNameInput.value = newValue.slice(0, -2);  // do not allow more than 32 character names
    });

    projectNameInput.on('blur', () => {
        projectSettingsChanged = true;
        const nameBefore = projectSettings.name;
        projectSettings.name = projectNameInput.value;
        saveProject({ name: nameBefore }, initialLoad);
        // hot reload label in sidebar menu element
        editor.call('picker:project:updateProjectSettingsMenuItem', projectNameInput.value);
    });

    // project description group
    const projectDescGroup = new pcui.Container({
        flex: true,
        class: 'settings-group'
    });
    settingsContainer.append(projectDescGroup);

    const projectDescLabel = new pcui.Label({
        text: 'Description'
    });
    projectDescGroup.append(projectDescLabel.element);
    const projectDescInput = new pcui.TextAreaInput({
        enabled: isAdmin(),
        class: 'form-input',
        value: projectSettings.description,
        renderChanges: true,
        height: 150
    });

    projectDescInput.on('change', () => {
        projectSettingsChanged = true;
        const descriptionBefore = projectSettings.description;
        projectSettings.description = projectDescInput.value;
        saveProject({ description: descriptionBefore }, initialLoad);
    });

    projectDescInput.element.id = 'description';
    projectDescGroup.append(projectDescInput.element);

    // private settings container
    const privateSettings = new pcui.Element(document.createElement('div'), {
        class: 'horizontal-container'
    });
    settingsContainer.append(privateSettings.dom);

    const privateLabel = new pcui.Label({
        text: 'Private Project'
    });
    privateSettings.dom.appendChild(privateLabel.element);

    const privateToggle = new pcui.BooleanInput({
        enabled: isAdmin() && editor.call('users:allowPrivate', config.owner),
        type: 'toggle',
        value: projectSettings.private
    });

    privateToggle.on('click', () => {
        if (initialLoad) return;
        editor.call('picker:project:changeVisibility', privateToggle.value ? 'Private' : 'Public');
    });
    privateSettings.dom.appendChild(privateToggle.element);

    // project url
    const projectURLSettings = new pcui.Element(document.createElement('div'), {
        class: 'horizontal-container'
    });
    settingsContainer.append(projectURLSettings.dom);

    const projectUrlLabel = new pcui.Label({
        text: 'Share Project'
    });
    projectURLSettings.dom.appendChild(projectUrlLabel.element);

    const projectURLButton = new pcui.Button({
        icon: 'E357',
        text: 'Copy URL'
    });
    projectURLSettings.dom.appendChild(projectURLButton.element);

    projectURLButton.on('click', () => {
        navigator.clipboard.writeText(`${config.url.home}/editor/project/${currentProject.id}`);

        copiedURLPopup.dom.classList.add('open');
        setTimeout(() => {
            copiedURLPopup.dom.classList.remove('open');
        }, 3000);
    });

    // action buttons container
    const actionButtonsContainer = new pcui.Container({
        class: 'action-buttons',
        flex: true
    });
    panel.append(actionButtonsContainer);

    const exportProjectButtonContainer = new pcui.Container({ flex: true });
    actionButtonsContainer.append(exportProjectButtonContainer);

    // export project button
    const exportProjectButton = new pcui.Button({
        class: 'full-width-button',
        icon: 'E228',
        text: 'EXPORT PROJECT'
    });
    exportProjectButtonContainer.append(exportProjectButton);

    const loader = new pcui.Element(document.createElement('div'), {
        class: ['loader', 'xsmall', 'white']
    });
    loader.dom.style.display = 'none';
    exportProjectButtonContainer.append(loader);

    exportProjectButton.on('click', () => {
        toggleLoader(true);
        exportProject();
    });

    // delete project button
    const deleteProjectButton = new pcui.Button({
        class: 'full-width-button',
        icon: 'E124',
        text: 'DELETE PROJECT',
        enabled: false,
        hidden: true
    });
    deleteProjectButton.element.id = 'delete-project-button';
    actionButtonsContainer.append(deleteProjectButton);

    deleteProjectButton.on('click', () => {
        editor.call('picker:project:modal:deleteProjectConfirmation', currentProject);
    });

    // copied URL to clipboard popup box
    const copiedURLPopup = new pcui.Container({
        class: 'copied-url-popup'
    });
    panel.append(copiedURLPopup);

    const copiedURLText = new pcui.Label({
        text: 'URL Copied to the clipboard!'
    });
    copiedURLPopup.append(copiedURLText);

    // CONTROLLERS

    // overwrites project settings values based on argument passed (useful for failed saves)
    const resetProjectSettings = (settings) => {
        if ('name' in settings) {
            projectSettings.name = settings.name;
            projectNameInput.value = settings.name;
        }
        if ('description' in settings) {
            projectSettings.description = settings.description;
            projectDescInput.value = settings.description;
        }
        if ('private' in settings) {
            projectSettings.private = settings.private;
            privateToggle.value = settings.private;
        }
    };

    // saves any changes made to the project to the database through API call
    const saveProject = (originalField, initialLoad) => {
        // only allow settings to be saved if user has admin rights to project
        if (currentProject.access_level === 'admin' && !initialLoad) {
            editor.call('projects:save', currentProject, projectSettings, null, (err) => {
                editor.call('picker:project:buildAlert', panel, `SAVE ERROR: ${err}`);
                resetProjectSettings(originalField);
            });
        }
    };

    // handles the flow for project exporting as well as managing error and loading states
    const exportProject = () => {
        let jobId;
        let downloadURL;
        let exportError;

        editor.call('projects:export', currentProject.id, function (job) {
            jobId = job.id;

            // when job is updated get the job
            var evt = editor.on('messenger:job.update', function (msg) {
                if (msg.job.id === jobId) {
                    evt.unbind();

                    // get job
                    Ajax({
                        url: `{{url.api}}/jobs/${job.id}`,
                        auth: true
                    })
                    .on('load', function (status, job) {
                        if (job.status === 'complete') {
                            downloadURL = job.data.url;
                            window.open(downloadURL, '_blank');
                        } else if (job.status === 'error') {
                            exportError = job.messages[0] || "There was an error while importing";
                            editor.call('picker:project:buildAlert', panel, exportError);
                        }

                        toggleLoader(false);
                    })
                    .on('error', function (error) {
                        editor.call('picker:project:buildAlert', panel, error);
                    });
                }
            });
            events.push(evt);

        }, function (error) {
            exportError = "Error: " + error;
            editor.call('picker:project:buildAlert', panel, exportError);
            toggleLoader(false);
        });
    };

    // LOCAL UTILS

    // helper method to determine whether a current user can export a project based on access level
    const exportDisabled = () => {
        // only logged in users
        if (!config.self)
            return true;

        // always allow super users
        if (config.self.flags.superUser)
            return false;

        // only allow if we have write or admin access
        if (currentProject.access_level !== 'write' && currentProject.access_level !== 'admin')
            return true;

        // only allow if we are viewing our project list or one of our orgs' project list
        if (!editor.call('project:management:showOwnerView'))
            return true;

        // all good -- export it
        return false;
    };

    // helper method to delete all outstanding events on close
    const destroyEvents = () => {
        events.forEach((evt) => {
            if (evt) evt.unbind();
        });
        events = [];
    };

    // helper method to confirm visibility change
    const saveVisibilityChange = () => {
        projectSettingsChanged = true;
        const privateBefore = projectSettings.private;
        projectSettings.private = privateToggle.value;
        saveProject({ private: privateBefore }, initialLoad);
    };

    // EVENTS

    // on show
    panel.on('show', () => {
        editor.call('picker:project:showThumbnailControls');
        projectSettingsChanged = false;
        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', false);
    });

    // on hide
    panel.on('hide', function () {
        destroyEvents();

        if (projectSettingsChanged) editor.call('picker:project:cms:refreshProjects');

        copiedURLPopup.dom.classList.remove('open');  // close clipboard popup

        editor.call('picker:project:hideAlerts');
        editor.call('picker:project:hideThumbnailControls');
        projectSettingsChanged = false;

        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', true);
    });

    editor.on('viewport:hover', function (state) {
        if (state && !panel.hidden) {
            setTimeout(function () {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // show the CMS view for the main project picker
    editor.method('picker:project:main:cmsView', () => {
        exportProjectButton.enabled = !exportDisabled();
    });

    // show the main project picker
    editor.method('picker:project:main', function () {
        exportProjectButton.enabled = !exportDisabled();
        editor.call('picker:project', 'project-main');
    });

    // hook to reload all main elements of the screen
    editor.method('picker:project:main:refreshUI', () => {
        currentProject = editor.call('picker:project:getCurrent');
        unlockButton.enabled = currentProject.owner_id === config.self.id || editor.call('project:management:isOrgAdmin', currentProject.owner_id, config.self);

        projectSettings = {
            id: currentProject.id,
            name: currentProject.name,
            description: currentProject.description,
            private: currentProject.private
        };
        panelName = currentProject.name.toUpperCase();

        editor.call('picker:project:updateProjectSettingsMenuItem', panelName);

        // only show locked view if locked project
        if (currentProject.locked) {
            lockedContainer.dom.style.display = 'flex';
            settingsContainer.dom.style.display = 'none';
        } else {
            // only show settings container if not locked project
            settingsContainer.dom.style.display = 'flex';
            lockedContainer.dom.style.display = 'none';
        }

        // only show delete project button if not current project and admin
        deleteProjectButton.hidden = currentProject.id === config.project.id;
        deleteProjectButton.enabled = currentProject.id !== config.project.id && isAdmin();

        projectNameInput.enabled = isAdmin();
        projectDescInput.enabled = isAdmin();
        privateToggle.enabled = isAdmin();

        initialLoad = true;

        projectNameInput.value = currentProject.name;
        projectDescInput.value = currentProject.description;
        privateToggle.value = currentProject.private;

        exportProjectButton.enabled = !exportDisabled();

        initialLoad = false;  // once initial load happens, reset flag
    });

    // hook to get current private settings
    editor.method('picker:project:getPrivateSetting', () => {
        return privateToggle.value;
    });

    // hook to confirm project visibility changes
    editor.method('picker:project:confirmVisibilityChange', () => {
        saveVisibilityChange();
    });

    // hook to reset project visibility toggle
    editor.method('picker:project:resetVisibilityToggle', () => {
        privateToggle.value = projectSettings.private;
    });

});
