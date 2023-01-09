editor.once('load', function () {

    // GLOBAL VARIABLES
    const blankProject = {
        name: 'Blank Project',
        description: "A new blank project.",
        image: "/static/platform/images/home/blank_project.png",
        tags: ["games"],
        fork_from: null
    };
    const modelViewer = {
        name: 'Model Viewer',
        description: "A simple viewer application for any 3D model. Just drop the 3D model into the scene to upload.",
        image: '/static/platform/images/home/ModelViewer.png',
        tags: ["products"],
        fork_from: 446385
    };
    const vr = {
        name: 'VR Kit',
        description: 'An application to get you started quickly creating VR applications in PlayCanvas.',
        image: '/static/platform/images/home/VR.png',
        tags: ["immersive"],
        fork_from: 435780
    };

    // default values for form inputs
    const formInputs = {
        name: blankProject.name,
        description: blankProject.description,
        private: false,
        legacy: null,
        fork_from: null
    };

    let rootUser;
    let currentUser;
    let newProjectOwner;
    let selectedKitElement;  // ui element of selected starter kit
    let newKitData = blankProject;  // will store starterkit metadata to create project

    const starterKits = { 0: blankProject, 446385: modelViewer, 435780: vr };
    const starterKitDOMElements = [];  // list to store all starterkit DOM elements

    // UI

    // renders all of the starter kit UIs onto main panel
    const loadUIKits = () => {
        // add starter kits
        for (const [fork, starterkit] of Object.entries(starterKits)) {
            createStarterKitUI(starterkit, fork, kitsContainer);
        }

    };

    // helper method to construct UI for starterkit
    const createStarterKitUI = (starterkit, fork, container) => {
        // Starter Kit
        var starterKit = new pcui.Element(document.createElement('div'), {
            class: 'starter-kit'
        });
        container.dom.appendChild(starterKit.dom);
        // Blank project selected by default
        if (starterkit.name === 'Blank Project') {
            selectedKitElement = starterKit;
            selectedKitElement.dom.classList.add('selected');
        }

        starterKit.dom.addEventListener('mouseenter', () => {
            starterKit.dom.classList.add('hovered');
        });

        starterKit.dom.addEventListener('click', () => {
            if (selectedKitElement) selectedKitElement.dom.classList.remove('selected');

            selectedKitElement = starterKit;
            formInputs.name = starterKits[fork].name;
            formInputs.description = starterKits[fork].description;
            formInputs.private = false;
            formInputs.legacy = null;
            formInputs.fork_from = starterKits[fork].fork_from;

            selectedKitElement.dom.classList.add('selected');

            buildSidebar();  // rebuild sidebar
        });

        starterKit.dom.addEventListener('mouseleave', () => {
            starterKit.dom.classList.remove('hovered');
        });

        // Thumbnail
        var thumbnail = new pcui.Element(document.createElement('div'), {
            class: 'thumbnail'
        });
        starterKit.dom.appendChild(thumbnail.dom);

        // Image
        var image = new pcui.Element(document.createElement('img'));
        image.dom.src = starterkit.image;
        thumbnail.dom.appendChild(image.dom);

        // Overlay
        var overlay = new pcui.Element(document.createElement('div'), {
            class: 'overlay'
        });
        thumbnail.dom.appendChild(overlay.dom);

        // Preview Button (ignore for blank project)
        if (starterkit !== blankProject) {
            const previewButton = new pcui.Button({
                class: 'preview-button',
                icon: 'E286',
                hidden: true
            });
            overlay.dom.appendChild(previewButton.element);

            previewButton.on('click', () => {
                previewProject(starterkit.fork_from);
            });
        }

        // Title
        var title = new pcui.Element(document.createElement('h4'));
        title.dom.textContent = starterkit.name;
        starterKit.dom.appendChild(title.dom);

        // Add starter kit to list of DOM elements
        starterKitDOMElements.push(starterKit);
    };

    // helper method to build sidebar once data has loaded in
    const buildSidebar = () => {
        // refresh UI if it already exists
        if (formContent.dom.innerHTML !== "") formContent.dom.innerHTML = '';

        // make form groups for relevant inputs
        const textName = buildFormGroup('text', "Name", formContent);
        const textDescription = buildFormGroup('text', "Description", formContent);
        if (rootUser.organizations.length > 0) buildOrgDropdown(formContent);
        const togglePrivate = buildFormGroup('toggle', allowPrivate() ? "Private" : "Private (Premium)", formContent);
        if (formInputs.legacy !== null && currentUser.flags.hasLegacyScripts) {
            const toggleLegacy = buildFormGroup('toggle', "Legacy Scripts", formContent);
            toggleLegacy.on('change', () => { formInputs.legacy = toggleLegacy.value; });
        }

        textName.on('change', () => { formInputs.name = textName.value; });
        textName.on('focus', () => { textName.element.childNodes[0].select(); });
        textDescription.on('change', () => { formInputs.description = textDescription.value; });
        textDescription.on('focus', () => { textDescription.element.childNodes[0].select(); });
        togglePrivate.on('change', () => { formInputs.private = togglePrivate.value; });
    };

    // helper method to construct UI for different form groups
    const buildFormGroup = (type, label, container) => {
        const formGroupStyling = {
            'display': 'flex',
            'flex-direction': type !== 'toggle' ? 'column' : 'row',
            'justify-content': type !== 'toggle' ? 'start' : 'space-between'
        };
        const formGroup = new pcui.Element(document.createElement('div'));
        Object.assign(formGroup.style, formGroupStyling);
        container.dom.appendChild(formGroup.dom);

        switch (type) {
            case 'text': {
                const labelElement = new pcui.Label({
                    text: label
                });
                formGroup.dom.appendChild(labelElement.element);

                let textInput;
                if (label === 'Name') {
                    textInput = new pcui.TextInput({
                        class: 'form-control',
                        value: formInputs.name,
                        renderChanges: true
                    });
                } else {
                    textInput = new pcui.TextAreaInput({
                        class: 'form-control',
                        value: formInputs.description,
                        renderChanges: true,
                        height: 100
                    });
                    textInput.element.id = "description";
                }

                formGroup.dom.appendChild(textInput.element);
                return textInput;  // return element
            }

            case 'toggle': {
                const labelElement = new pcui.Label({
                    text: label
                });
                formGroup.dom.appendChild(labelElement.element);

                const toggleElement = new pcui.BooleanInput({
                    type: 'toggle',
                    value: false,
                    enabled: allowPrivate()
                });
                formGroup.dom.appendChild(toggleElement.element);
                return toggleElement;  // return element
            }
        }
    };

    // helper method to construct organizations dropdown
    const buildOrgDropdown = (container) => {
        let possibleOwners = [...rootUser.organizations];
        possibleOwners.unshift(rootUser);

        const formGroupStyling = {
            'display': 'flex',
            'flex-direction': 'column',
            'justify-content': 'space-between'
        };
        const ownerContainer = new pcui.Element(document.createElement('div'), { class: 'form-owner' });
        Object.assign(ownerContainer.style, formGroupStyling);
        container.dom.appendChild(ownerContainer.dom);

        const ownerLabel = new pcui.Label({
            text: 'Owner'
        });
        ownerContainer.dom.appendChild(ownerLabel.element);

        const ownerDropdown = new pcui.SelectInput({
            class: 'owner-dropdown',
            options: possibleOwners.map((owner) => { return { v: owner.id, t: owner.full_name }; }),
            value: newProjectOwner.id,
            renderChanges: true
        });
        ownerContainer.dom.appendChild(ownerDropdown.element);

        const ownerDropdownContainer = ownerDropdown.element.querySelector('.pcui-select-input-container-value');
        const ownerDropdownSelectedProfile = new pcui.Element(document.createElement('img'), {
            class: 'owner-profile'
        });
        ownerDropdownSelectedProfile.element.src = `${config.url.api}/users/${newProjectOwner.id}/thumbnail?size=32`;
        ownerDropdownContainer.appendChild(ownerDropdownSelectedProfile.dom);

        const ownerDropdownList = ownerDropdown.element.querySelector('.pcui-select-input-container-value .pcui-select-input-list');
        let imageContainer;
        for (let i = 0; i < possibleOwners.length; i++) {
            const dropdownOption = ownerDropdownList.childNodes[i];

            imageContainer = new pcui.Element(document.createElement('img'), {
                class: 'owner-profile'
            });
            dropdownOption.appendChild(imageContainer.dom);
            imageContainer.element.src = `${config.url.api}/users/${possibleOwners[i].id}/thumbnail?size=32`;
        }

        ownerDropdown.on('change', () => {
            const oldOwner = newProjectOwner;
            newProjectOwner = possibleOwners.filter(org => org.id === ownerDropdown.value)[0];
            if (oldOwner !== newProjectOwner) {
                possibleOwners = [];  // reset possible owners list
                buildSidebar();  // rebuild sidebar on owner change
            }
        });
    };

    // helper method to toggle AJAX loader in create project button
    const toggleLoader = (toggle) => {
        if (toggle) {
            createBtn.text = '';
            loader.element.style.display = 'block';
        } else {
            loader.element.style.display = 'none';
            createBtn.text = 'CREATE';
        }
    };

    // overlay
    const root = editor.call('layout.root');
    const overlay = new ui.Overlay();
    overlay.clickable = false;
    overlay.hidden = true;
    overlay.class.add('picker-project-new');
    root.append(overlay);

    // main panel
    const panel = new pcui.Panel({
        headerText: 'NEW PROJECT'
    });
    overlay.append(panel);

    // playcanvas icon
    const playcanvasIcon = new pcui.Element(document.createElement('div'), {
        class: 'playcanvas-icon'
    });
    panel.header.append(playcanvasIcon);

    // close button
    const btnClose = new pcui.Button({
        class: 'close',
        icon: 'E132'
    });
    btnClose.on('click', function () {
        overlay.hidden = true;
    });
    panel.header.append(btnClose);

    // container
    const container = new pcui.Element(document.createElement('div'), {
        class: 'modal-new-project-container'
    });
    panel.append(container);

    // main view
    const mainView = new pcui.Element(document.createElement('div'), {
        class: 'modal-new-project-main-view'
    });
    container.dom.appendChild(mainView.dom);

    // kits container
    const kitsContainer = new pcui.Element(document.createElement('div'), {
        class: 'modal-new-project-kits-container'
    });
    mainView.dom.appendChild(kitsContainer.dom);

    // sidebar
    const sidebar = new pcui.Element(document.createElement('div'), {
        class: 'modal-new-project-sidebar'
    });
    container.dom.appendChild(sidebar.dom);

    // form content
    const formContent = new pcui.Element(document.createElement('div'), {
        class: 'modal-new-project-form-content'
    });
    sidebar.dom.appendChild(formContent.dom);

    // add create button
    const createBtnContainer = new pcui.Element(document.createElement('div'), {
        class: 'create-btn-container'
    });
    sidebar.dom.appendChild(createBtnContainer.dom);

    const createBtn = new pcui.Button({
        class: 'create-btn',
        text: 'CREATE'
    });
    createBtnContainer.dom.appendChild(createBtn.element);

    // attach listener to create button
    createBtn.on('click', () => {
        toggleLoader(true);
        newKitData.owner = newProjectOwner.username;
        newKitData.name = formInputs.name;
        newKitData.description = formInputs.description;
        newKitData.private = formInputs.private;
        newKitData.settings = {
            useLegacyScripts: formInputs.legacy === null ? false : formInputs.legacy,
            vr: false
        };
        newKitData.fork_from = formInputs.fork_from;
        createNewProject();
    });

    const loader = new pcui.Element(document.createElement('div'), {
        class: 'loader'
    });
    loader.element.style.display = 'none';  // hide loader by default
    createBtnContainer.dom.appendChild(loader.dom);

    // CONTROLLERS

    // retrieves list of all starter kits through API call
    const loadStarterKits = () => {
        editor.call('projects:listStarterKits', function (rawKits) {
            rawKits.forEach((rawkit) => {
                const starterkit = processProject(rawkit);
                const forkFrom = starterkit.fork_from;
                starterKits[forkFrom] = starterkit;
            });

            if (kitsContainer.dom) loadUIKits();
        });
    };

    // handles the flow for project creation as well as managing error and loading states
    const createNewProject = () => {
        const data = newKitData;

        let evt;
        editor.call('projects:create', data, (result) => {
            if (!data.fork_from) {
                editor.call('projects:getOne', result.id, (newProject) => {
                    if (newProject) {
                        result = newProject;
                    }

                    evt = editor.on('messenger:project.create', (msg) => {
                        if (msg.project_id !== result.id) return;
                        evt.unbind();
                        result.disabled = false;

                        toggleLoader(false);

                        // open confirmation modal
                        editor.call('picker:project:newProjectConfirmation', result.id);
                        overlay.hidden = true;  // close new project modal
                    });
                });
            } else {
                const jobId = result.id;

                evt = editor.on('messenger:job.update', (msg) => {
                    if (!jobId || jobId === msg.job.id) {
                        evt.unbind();

                        // get job
                        Ajax({
                            url: `{{url.api}}/jobs/${msg.job.id}`,
                            auth: true
                        })
                        .on('load', (status, response) => {
                            const job = response.data;

                            // handle job error
                            if (job.status === 'error') {
                                editor.call('picker:project:buildAlert', mainView, job.messages[0]);
                            } else {
                                window.open(`/editor/project/${job.forked_id}`);
                            }

                            toggleLoader(false);
                        });
                    }
                });
            }
        }, (err) => {
            // unsubscribe from messenger job.update
            if (data.fork_from && evt) evt.unbind();

            toggleLoader(false);

            if (err === 'Disk allowance exceeded') {
                editor.call('picker:project:buildAlert', mainView, err, true, 'UPGRADE', { url: `${config.url.home}/upgrade` });
            } else {
                editor.call('picker:project:buildAlert', mainView, err);
            }
        });

        newKitData = blankProject;  // restart new kit data
    };

    // handles clicks on preview button on starter kits
    const previewProject = (project_id) => {
        editor.call('projects:getOne', project_id, (response) => {
            const previewURL = response.primary_app_url;
            window.open(previewURL, '_blank');
        }, (err) => {
            editor.call('picker:project:buildAlert', mainView, err);
        });
    };

    // LOCAL UTILS

    // helper method that determines whether user has rights to make a private project
    const allowPrivate = () => {
        return newProjectOwner.plan_type !== 'free';
    };

    // helper method to process a project according to required schema
    const processProject = (raw) => {
        return {
            name: raw.name,
            description: raw.description,
            image: raw.thumbnails.m,
            tags: raw.tags,
            fork_from: raw.project_id
        };
    };

    // EVENTS

    // load and show data
    overlay.on('show', function () {
        // open picker
        editor.emit('picker:open', 'project-new');

        loadStarterKits();

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // clean up
    overlay.on('hide', function () {
        if (kitsContainer) kitsContainer.destroy();  // delete all starter kit UI
        editor.emit('picker:close', 'project-new');  // close panel

        editor.call('picker:project:hideAlerts');

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    // prevent viewport hovering when the picker is shown
    editor.on('viewport:hover', function (state) {
        if (state && !overlay.hidden) {
            setTimeout(function () {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // displays the new project modal
    editor.method('picker:project:newProject', function () {
        rootUser = editor.call('picker:project:cms:rootUser');
        currentUser = editor.call('picker:project:cms:currentUser');
        newProjectOwner = currentUser;
        formInputs.legacy = currentUser.flags.hasLegacyScripts ? false : null;
        buildSidebar();
        overlay.hidden = false;
    });

});
