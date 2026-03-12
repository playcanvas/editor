import { BooleanInput, Button, Container, Element, Label, Overlay, Panel, SelectInput, TextAreaInput, TextInput } from '@playcanvas/pcui';

editor.once('load', () => {

    // GLOBAL VARIABLES
    const blankProject = {
        name: 'Blank Project',
        description: 'A new blank project.',
        image: '/static/platform/images/home/blank_project.png',
        tags: ['games'],
        fork_from: null
    };
    const modelViewer = {
        name: 'Model Viewer',
        description: 'A simple viewer application for any 3D model. Just drop the 3D model into the scene to upload.',
        image: '/static/platform/images/home/ModelViewer.jpg',
        tags: ['products'],
        fork_from: 446385
    };
    const vr = {
        name: 'VR Kit',
        description: 'An application to get you started quickly creating VR applications in PlayCanvas.',
        image: '/static/platform/images/home/VR.jpg',
        tags: ['immersive'],
        fork_from: 435780
    };

    // default values for form inputs
    const formInputs = {
        name: blankProject.name,
        description: blankProject.description,
        private: false,
        fork_from: null
    };

    let rootUser;
    let newProjectOwner;
    let selectedKitElement;  // ui element of selected starter kit
    let newKitData = blankProject;  // will store starterkit metadata to create project

    const starterKits = { 0: blankProject, 446385: modelViewer, 435780: vr };

    // UI

    // helper method to construct UI for starterkit
    const createStarterKitUI = (starterkit, fork, kitContainer) => {
        // Starter Kit
        const starterKit = new Container({
            class: 'starter-kit'
        });
        kitContainer.append(starterKit);
        // Blank project selected by default
        if (starterkit.name === 'Blank Project') {
            selectedKitElement = starterKit;
            selectedKitElement.dom.classList.add('selected');
        }

        starterKit.dom.addEventListener('mouseenter', () => {
            starterKit.dom.classList.add('hovered');
        });

        starterKit.dom.addEventListener('mouseleave', () => {
            starterKit.dom.classList.remove('hovered');
        });

        starterKit.dom.addEventListener('click', () => {
            if (selectedKitElement) {
                selectedKitElement.dom.classList.remove('selected');
            }

            selectedKitElement = starterKit;
            formInputs.name = starterKits[fork].name;
            formInputs.description = starterKits[fork].description;
            formInputs.private = false;
            formInputs.fork_from = starterKits[fork].fork_from;

            selectedKitElement.dom.classList.add('selected');

            buildSidebar();  // rebuild sidebar
        });

        // Thumbnail
        const thumbnail = new Container({
            class: 'thumbnail'
        });
        starterKit.append(thumbnail);

        // Image
        const image = new Element({
            dom: 'img'
        });
        image.dom.src = starterkit.image;
        thumbnail.append(image);

        // Overlay
        const thumbnailOverlay = new Container({
            class: 'overlay'
        });
        thumbnail.append(thumbnailOverlay);

        // Preview Button (ignore for blank project)
        if (starterkit !== blankProject) {
            const previewButton = new Button({
                class: 'preview-button',
                icon: 'E286',
                hidden: true
            });
            thumbnailOverlay.append(previewButton);

            previewButton.on('click', () => {
                previewProject(starterkit.fork_from);
            });
        }

        // Title
        const title = new Element({
            dom: 'h4'
        });
        title.dom.textContent = starterkit.name;
        starterKit.append(title);
    };

    // helper method to build sidebar once data has loaded in
    const buildSidebar = () => {
        // refresh UI if it already exists
        formContent.clear();

        // make form groups for relevant inputs
        const textName = buildFormGroup('text', 'Name', formContent);
        const textDescription = buildFormGroup('text', 'Description', formContent);
        if (rootUser.organizations.length > 0) {
            buildOrgDropdown(formContent);
        }
        const togglePrivate = buildFormGroup('toggle', allowPrivate() ? 'Private' : 'Private (Premium)', formContent);

        textName.on('change', () => {
            formInputs.name = textName.value;
        });
        textName.on('focus', () => {
            textName.dom.childNodes[0].select();
        });
        textDescription.on('change', () => {
            formInputs.description = textDescription.value;
        });
        textDescription.on('focus', () => {
            textDescription.dom.childNodes[0].select();
        });
        togglePrivate.on('change', () => {
            formInputs.private = togglePrivate.value;
        });
    };

    // helper method to construct UI for different form groups
    const buildFormGroup = (type, label, formContainer) => {
        const formGroup = new Container({
            flex: true,
            flexDirection: type !== 'toggle' ? 'column' : 'row',
            justifyContent: type !== 'toggle' ? 'start' : 'space-between'
        });
        formContainer.append(formGroup);

        switch (type) {
            case 'text': {
                const labelElement = new Label({
                    text: label
                });
                formGroup.append(labelElement);

                let textInput;
                if (label === 'Name') {
                    textInput = new TextInput({
                        class: 'form-control',
                        value: formInputs.name,
                        renderChanges: true
                    });
                } else {
                    textInput = new TextAreaInput({
                        class: 'form-control',
                        value: formInputs.description,
                        renderChanges: true,
                        height: 100
                    });
                    textInput.dom.id = 'description';
                }

                formGroup.append(textInput);
                return textInput;
            }

            case 'toggle': {
                const labelElement = new Label({
                    text: label
                });
                formGroup.append(labelElement);

                const toggleElement = new BooleanInput({
                    type: 'toggle',
                    value: false,
                    enabled: allowPrivate()
                });
                formGroup.append(toggleElement);
                return toggleElement;
            }
        }
    };

    // helper method to construct organizations dropdown
    const buildOrgDropdown = (formContainer) => {
        let possibleOwners = [...rootUser.organizations];
        possibleOwners.unshift(rootUser);

        const ownerContainer = new Container({
            class: 'form-owner',
            flex: true,
            flexDirection: 'column',
            justifyContent: 'space-between'
        });
        formContainer.append(ownerContainer);

        const ownerLabel = new Label({
            text: 'Owner'
        });
        ownerContainer.append(ownerLabel);

        const ownerDropdown = new SelectInput({
            class: 'owner-dropdown',
            options: possibleOwners.map((owner) => {
                return { v: owner.id, t: owner.full_name };
            }),
            value: newProjectOwner.id,
            renderChanges: true
        });
        ownerContainer.append(ownerDropdown);

        const ownerDropdownContainer = ownerDropdown.dom.querySelector('.pcui-select-input-container-value');
        const ownerDropdownSelectedProfile = new Element({
            dom: 'img',
            class: 'owner-profile'
        });
        ownerDropdownSelectedProfile.dom.src = `${config.url.api}/users/${newProjectOwner.id}/thumbnail?size=32`;
        ownerDropdownContainer.appendChild(ownerDropdownSelectedProfile.dom);

        const ownerDropdownList = ownerDropdown.dom.querySelector('.pcui-select-input-container-value .pcui-select-input-list');
        let imageContainer;
        for (let i = 0; i < possibleOwners.length; i++) {
            const dropdownOption = ownerDropdownList.childNodes[i];

            imageContainer = new Element({
                dom: 'img',
                class: 'owner-profile'
            });
            dropdownOption.appendChild(imageContainer.dom);
            imageContainer.dom.src = `${config.url.api}/users/${possibleOwners[i].id}/thumbnail?size=32`;
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
    const toggleLoader = (loading: boolean) => {
        loader.hidden = !loading;
        createBtn.text = loading ? '' : 'CREATE';
    };

    // overlay
    const root = editor.call('layout.root');
    const overlay = new Overlay({
        clickable: false,
        class: 'picker-project-new',
        hidden: true
    });
    root.append(overlay);

    // main panel
    const panel = new Panel({
        headerText: 'NEW PROJECT'
    });
    overlay.append(panel);

    // playcanvas icon
    const playcanvasIcon = new Element({
        class: 'playcanvas-icon'
    });
    panel.header.append(playcanvasIcon);

    // close button
    const btnClose = new Button({
        class: 'close',
        icon: 'E132'
    });
    btnClose.on('click', () => {
        overlay.hidden = true;
    });
    panel.header.append(btnClose);

    // container
    const modalContainer = new Container({
        class: 'modal-new-project-container'
    });
    panel.append(modalContainer);

    // main view
    const mainView = new Container({
        class: 'modal-new-project-main-view'
    });
    modalContainer.append(mainView);

    // kits container
    const kitsContainer = new Container({
        class: 'modal-new-project-kits-container'
    });
    mainView.append(kitsContainer);

    // sidebar
    const sidebar = new Container({
        class: 'modal-new-project-sidebar'
    });
    modalContainer.append(sidebar);

    // form content
    const formContent = new Container({
        class: 'modal-new-project-form-content'
    });
    sidebar.append(formContent);

    // add create button
    const createBtnContainer = new Container({
        class: 'create-btn-container'
    });
    sidebar.append(createBtnContainer);

    const createBtn = new Button({
        class: 'create-btn',
        text: 'CREATE'
    });
    createBtnContainer.append(createBtn);

    // attach listener to create button
    createBtn.on('click', () => {
        toggleLoader(true);
        newKitData.owner = newProjectOwner.username;
        newKitData.name = formInputs.name;
        newKitData.description = formInputs.description;
        newKitData.private = formInputs.private;
        newKitData.fork_from = formInputs.fork_from;
        createNewProject();
    });

    const loader = new Element({
        class: 'loader',
        hidden: true
    });
    createBtnContainer.append(loader);

    // CONTROLLERS

    // retrieves list of all starter kits through API call
    const loadStarterKits = () => {
        editor.call('projects:listStarterKits', (rawKits) => {
            rawKits.forEach((rawkit) => {
                const starterkit = processProject(rawkit);
                const forkFrom = starterkit.fork_from;
                starterKits[forkFrom] = starterkit;
            });

            if (kitsContainer.dom) {
                for (const [fork, starterkit] of Object.entries(starterKits)) {
                    createStarterKitUI(starterkit, fork, kitsContainer);
                }
            }
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
                        if (msg.project_id !== result.id) {
                            return;
                        }
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
                        editor.api.globals.rest.jobs.jobGet({ jobId: msg.job.id })
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
            if (data.fork_from && evt) {
                evt.unbind();
            }

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
    overlay.on('show', () => {
        // open picker
        editor.emit('picker:open', 'project-new');

        loadStarterKits();

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // clean up
    overlay.on('hide', () => {
        kitsContainer.destroy();
        editor.emit('picker:close', 'project-new');  // close panel

        editor.call('picker:project:hideAlerts');

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    // prevent viewport hovering when the picker is shown
    editor.on('viewport:hover', (state) => {
        if (state && !overlay.hidden) {
            setTimeout(() => {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // displays the new project modal
    editor.method('picker:project:newProject', () => {
        rootUser = editor.call('picker:project:cms:rootUser');
        newProjectOwner = editor.call('picker:project:cms:currentUser');
        buildSidebar();
        overlay.hidden = false;
    });

});
