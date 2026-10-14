import {
    BooleanInput,
    Button,
    Container,
    Element,
    Label,
    Overlay,
    Panel,
    SelectInput,
    TextAreaInput,
    TextInput
} from '@playcanvas/pcui';

import { config } from '@/editor/config';

const KIT_SKELETON_COUNT = 8;

editor.once('load', () => {
    // GLOBAL VARIABLES
    const blankProject = {
        name: 'Blank Project',
        description: 'A new blank project.',
        image: `${config.url.frontend}static/img/blank-project-kit.webp`,
        tags: ['games'],

        // the blank template playcanvas.com forks, so new projects start with its scene and settings
        fork_from: 1162945
    };
    const modelViewer = {
        name: 'Model Viewer',
        description: 'A simple viewer application for any 3D model. Just drop the 3D model into the scene to upload.',
        image: `${config.url.frontend}static/img/model-viewer-kit.webp`,
        tags: ['products'],
        fork_from: 446385
    };
    const vr = {
        name: 'VR Kit',
        description: 'An application to get you started quickly creating VR applications in PlayCanvas.',
        image: `${config.url.frontend}static/img/vr-kit.webp`,
        tags: ['immersive'],
        fork_from: 435780
    };

    // default values for form inputs
    const formInputs = {
        name: blankProject.name,
        description: blankProject.description,
        private: false,
        fork_from: blankProject.fork_from
    };

    let rootUser;
    let newProjectOwner;
    let selectedKitElement; // ui element of selected starter kit
    let newKitData = blankProject; // will store starterkit metadata to create project

    const builtInKits = { 0: blankProject, 446385: modelViewer, 435780: vr };
    let starterKits = { ...builtInKits };

    // kits are cached for the session, like the builds list: reopening shows them instantly
    // and refreshes in the background, rebuilding only when the server list changed
    let renderedKits = null; // signature of the kits in the grid
    let blankKitElement = null;
    const kitElements = new Map(); // fork id -> kit card

    // UI

    // helper method to construct UI for starterkit
    const createStarterKitUI = (starterkit, fork, kitContainer) => {
        // Starter Kit
        const starterKit = new Container({
            class: 'starter-kit'
        });
        kitContainer.append(starterKit);
        kitElements.set(String(fork), starterKit);
        // Blank project selected by default
        if (starterkit.name === 'Blank Project') {
            blankKitElement = starterKit;
            selectedKitElement = starterKit;
            selectedKitElement.class.add('selected');
        }

        starterKit.dom.addEventListener('mouseenter', () => {
            starterKit.class.add('hovered');
        });

        starterKit.dom.addEventListener('mouseleave', () => {
            starterKit.class.remove('hovered');
        });

        starterKit.dom.addEventListener('click', () => {
            if (selectedKitElement) {
                selectedKitElement.class.remove('selected');
            }

            selectedKitElement = starterKit;
            formInputs.name = starterKits[fork].name;
            formInputs.description = starterKits[fork].description;
            formInputs.private = false;
            formInputs.fork_from = starterKits[fork].fork_from;

            selectedKitElement.class.add('selected');

            buildSidebar(); // rebuild sidebar
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

        // Preview Button
        const previewButton = new Button({
            class: 'preview-button',
            hidden: true
        });
        thumbnailOverlay.append(previewButton);

        previewButton.on('click', () => {
            previewProject(starterkit.fork_from);
        });

        // Title
        const title = new Element({
            dom: 'h4'
        });
        title.dom.textContent = starterkit.name;
        starterKit.append(title);

        const desc = new Label({ class: 'kit-desc', text: starterkit.description });
        starterKit.append(desc);
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

        const ownerDropdownList = ownerDropdown.dom.querySelector(
            '.pcui-select-input-container-value .pcui-select-input-list'
        );
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
            newProjectOwner = possibleOwners.filter((org) => org.id === ownerDropdown.value)[0];
            if (oldOwner !== newProjectOwner) {
                possibleOwners = []; // reset possible owners list
                buildSidebar(); // rebuild sidebar on owner change
            }
        });
    };

    // helper method to toggle AJAX loader in create project button
    const toggleLoader = (loading: boolean) => {
        createBtn.text = loading ? '' : 'Create project';

        // setting text replaces the button's children, so put the spinner back
        createBtn.dom.appendChild(loader.dom);
        loader.hidden = !loading;
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
    mainView.append(new Label({ class: 'modal-new-project-heading', text: 'Start from a kit' }));
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

    const cancelBtn = new Button({
        class: 'cancel-btn',
        text: 'Cancel'
    });
    cancelBtn.on('click', () => {
        overlay.hidden = true;
    });
    createBtnContainer.append(cancelBtn);

    const createBtn = new Button({
        class: 'create-btn',
        text: 'Create project'
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

    // spinner sits inside the create button while it's busy
    const loader = new Element({
        class: 'loader',
        hidden: true
    });
    createBtn.dom.appendChild(loader.dom);

    // CONTROLLERS

    // retrieves list of all starter kits through API call
    // pulsing placeholders until the first kit list arrives
    const renderKitSkeleton = () => {
        kitsContainer.clear();
        for (let i = 0; i < KIT_SKELETON_COUNT; i++) {
            const card = new Container({ class: ['starter-kit', 'skeleton'] });
            for (const cls of ['thumb', 'title', 'line']) {
                card.append(new Element({ class: ['kit-bone', cls] }));
            }
            kitsContainer.append(card);
        }
    };

    const loadStarterKits = () => {
        editor.call('projects:listStarterKits', (rawKits) => {
            const kits = { ...builtInKits };
            rawKits.forEach((rawkit) => {
                const starterkit = processProject(rawkit);
                kits[starterkit.fork_from] = starterkit;
            });

            const signature = JSON.stringify(kits);
            if (signature === renderedKits) {
                return;
            }
            renderedKits = signature;
            starterKits = kits;

            // a background refresh keeps a kit the user already picked
            const kept =
                selectedKitElement && selectedKitElement !== blankKitElement ? String(formInputs.fork_from) : null;
            kitElements.clear();
            kitsContainer.clear();
            for (const [fork, starterkit] of Object.entries(starterKits)) {
                createStarterKitUI(starterkit, fork, kitsContainer);
            }
            const keptElement = kept && kitElements.get(kept);
            if (keptElement) {
                selectedKitElement.class.remove('selected');
                selectedKitElement = keptElement;
                selectedKitElement.class.add('selected');
            } else if (kept) {
                // the picked kit is gone: fall back to blank, like a fresh open
                Object.assign(formInputs, {
                    name: blankProject.name,
                    description: blankProject.description,
                    private: false,
                    fork_from: blankProject.fork_from
                });
                buildSidebar();
            }
        });
    };

    // handles the flow for project creation as well as managing error and loading states
    const createNewProject = () => {
        const data = newKitData;

        let evt;
        editor.call(
            'projects:create',
            data,
            (result) => {
                // every kit, blank included, is a fork: wait for the fork job, then offer to open the project
                const jobId = result.id;

                evt = editor.on('messenger:job.update', (msg) => {
                    if (!jobId || jobId === msg.job.id) {
                        evt.unbind();

                        // get job
                        editor.api.globals.rest.jobs.jobGet({ jobId: msg.job.id }).on('load', (status, response) => {
                            const job = response.data;

                            // handle job error
                            if (job.status === 'error') {
                                editor.call('picker:project:buildAlert', mainView, job.messages[0]);
                            } else {
                                editor.call('picker:project:newProjectConfirmation', job.forked_id);
                                overlay.hidden = true; // close new project modal
                            }

                            toggleLoader(false);
                        });
                    }
                });
            },
            (err) => {
                // unsubscribe from messenger job.update
                if (evt) {
                    evt.unbind();
                }

                toggleLoader(false);

                if (err === 'Disk allowance exceeded') {
                    editor.call('picker:project:buildAlert', mainView, err, true, 'UPGRADE', {
                        url: `${config.url.home}/upgrade`
                    });
                } else {
                    editor.call('picker:project:buildAlert', mainView, err);
                }
            }
        );

        newKitData = blankProject; // restart new kit data
    };

    // handles clicks on preview button on starter kits
    const previewProject = (project_id) => {
        editor.call(
            'projects:getOne',
            project_id,
            (response) => {
                // kits without a published app, like the blank template, preview as their project page
                const previewURL = response.primary_app_url ?? `${config.url.home}/project/${project_id}`;
                window.open(previewURL, '_blank');
            },
            (err) => {
                editor.call('picker:project:buildAlert', mainView, err);
            }
        );
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

        if (renderedKits) {
            // cached grid: back to the blank kit, matching the form reset in picker:project:newProject
            selectedKitElement?.class.remove('selected');
            selectedKitElement = blankKitElement;
            selectedKitElement?.class.add('selected');
            mainView.dom.scrollTop = 0;
        } else {
            renderKitSkeleton();
        }
        loadStarterKits();

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // clean up
    overlay.on('hide', () => {
        editor.emit('picker:close', 'project-new'); // close panel

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

        // start from the blank kit, matching the default selection in the kit grid
        Object.assign(formInputs, {
            name: blankProject.name,
            description: blankProject.description,
            private: false,
            fork_from: blankProject.fork_from
        });
        buildSidebar();
        overlay.hidden = false;
    });
});
