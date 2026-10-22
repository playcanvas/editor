import { BooleanInput, Container, Element, Label, SelectInput, TextAreaInput, TextInput } from '@playcanvas/pcui';

import { backend, UNSUPPORTED_TIP } from '@/common/backend';
import { service } from '@/common/supports';
import { TooltipHandle } from '@/common/tooltips';
import { config } from '@/editor/config';

import { button } from './components/button';
import { dialog } from './components/dialog';
import { spinner } from './components/spinner';

const UPGRADE_BLOCK = 'Forking a private project needs a paid plan.';
const FIT_HEIGHT = 'pcui-select-input-fit-height';

// the owner list's margin from its field
const LIST_GAP = 4;

editor.once('load', () => {
    // GLOBAL VARIABLES
    // the form's values: a kit's, or the project being forked
    const formInputs = {
        name: '',
        description: '',
        private: false,
        fork_from: null
    };

    let rootUser;
    let newProjectOwner;
    let newKitData: Record<string, unknown> = {}; // what gets created: the kit's data, or the fork's
    let forking = null; // the project being forked; null when creating a new project

    // UI

    // helper method to build sidebar once data has loaded in
    const buildSidebar = () => {
        // refresh UI if it already exists
        formContent.clear();
        formInputs.private = formInputs.private && allowPrivate();

        // forking: the source project first; a blocked fork shows why in place of the form
        const block = forking && forkBlock(forking);
        createBtn.enabled = !block;
        if (forking) {
            buildForkSource(formContent);
            if (block) {
                const reason = new Container({ class: ['pm-callout', 'danger', 'fork-blocked'] });
                reason.append(new Label({ text: block }));
                if (block === UPGRADE_BLOCK) {
                    const upgrade = document.createElement('a');
                    upgrade.href = `${config.url.home}/upgrade`;
                    upgrade.target = '_blank';
                    upgrade.textContent = 'Upgrade';
                    reason.dom.appendChild(upgrade);
                }
                formContent.append(reason);
                return;
            }
            formContent.append(new Label({ class: 'fork-divider', text: 'your copy' }));
        }

        // make form groups for relevant inputs
        const textName = buildFormGroup('text', 'Name', formContent);
        const textDescription = buildFormGroup('text', 'Description', formContent);
        if (rootUser.organizations.length > 0) {
            buildOrgDropdown(formContent);
        } else if (forking) {
            buildOwnerField(formContent);
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

        // forks finish as jobs
        createBtn.enabled = !!backend().projectCreation && (!formInputs.fork_from || !!backend().jobs);
        if (createBtn.enabled) {
            createTooltip.detach();
        } else {
            createTooltip.attach(createBtn.dom);
        }
    };

    // with no organizations you're the only possible owner, so show it as a plain field, not a one-item dropdown
    const buildOwnerField = (formContainer) => {
        const group = new Container({ class: 'form-owner', flex: true, flexDirection: 'column' });
        formContainer.append(group);
        group.append(new Label({ text: 'Owner' }));
        const field = new Container({ class: 'owner-static' });
        group.append(field);
        const avatar = new Element({ dom: 'img', class: 'owner-profile' });
        (avatar.dom as HTMLImageElement).src = `${config.url.api}/users/${rootUser.id}/thumbnail?size=32`;
        field.append(avatar);
        field.append(new Label({ class: 'owner-static-name', text: rootUser.full_name || rootUser.username }));
    };

    // the project being forked: its logo, name, owner and plays
    const buildForkSource = (parent) => {
        const source = new Container({ class: 'fork-source' });
        parent.append(source);
        const logo = new Element({ dom: 'img', class: 'fork-source-logo' });
        (logo.dom as HTMLImageElement).src =
            forking.thumbnails?.m ?? `${config.url.frontend}static/img/blank-project-kit.webp`;
        (logo.dom as HTMLImageElement).alt = '';
        source.append(logo);
        const info = new Container({ class: 'fork-source-info' });
        source.append(info);
        info.append(new Label({ class: 'fork-source-eyebrow', text: 'Forking from' }));
        info.append(new Label({ class: 'fork-source-name', text: forking.name }));
        const meta = new Container({ class: 'fork-source-meta' });
        info.append(meta);
        const avatar = new Element({ dom: 'img', class: 'fork-source-avatar' });
        (avatar.dom as HTMLImageElement).src = `${config.url.api}/users/${forking.owner_id}/thumbnail?size=32`;
        meta.append(avatar);
        // the owner's display name, as on the cards and in the owner picker; the username until it loads
        const ownerLabel = new Label({ text: forking.owner?.username ?? forking.owner ?? '' });
        meta.append(ownerLabel);
        const known = [rootUser, ...(rootUser.organizations ?? [])].find((u) => u.id === forking.owner_id);
        if (known) {
            ownerLabel.text = known.full_name || known.username;
        } else {
            editor.call('users:loadOne', forking.owner_id, (user) => {
                ownerLabel.text = user.full_name || user.username;
            });
        }
        if (forking.primary_app_url) {
            meta.append(
                new Label({ class: 'fork-source-plays', text: `${(forking.plays ?? 0).toLocaleString()} plays` })
            );
        }
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
                    value: formInputs.private,
                    enabled: allowPrivate()
                });
                formGroup.append(toggleElement);
                return toggleElement;
            }
        }
    };

    // helper method to construct organizations dropdown
    const buildOrgDropdown = (formContainer) => {
        let possibleOwners = [rootUser, ...rootUser.organizations].filter(canOwn);

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

        // pcui only flips the list up when it would leave the window, but the form scrolls and clips it first
        const open = ownerDropdown.open.bind(ownerDropdown);
        ownerDropdown.open = () => {
            open();
            const list = ownerDropdownList as HTMLElement;
            const form = formContainer.dom.getBoundingClientRect();
            const field = ownerDropdown.dom.getBoundingClientRect();
            const h = list.offsetHeight + LIST_GAP;
            const below = Math.min(form.bottom, window.innerHeight) - field.bottom;
            const up = h > below && h <= field.top - Math.max(form.top, 0);
            ownerDropdown.class[up ? 'add' : 'remove'](FIT_HEIGHT);
            if (h > below && !up) {
                list.style.maxHeight = `${below - LIST_GAP * 2}px`;
            }
        };

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
            // the old dropdown fires again, with no owner, as the rebuild destroys it
            const owner = possibleOwners.find((org) => org.id === ownerDropdown.value);
            if (!owner || owner === newProjectOwner) {
                return;
            }
            newProjectOwner = owner;

            // rebuild once pcui has finished the pick, which still touches this dropdown after the change event
            queueMicrotask(() => {
                possibleOwners = []; // reset possible owners list
                buildSidebar();
            });
        });
    };

    // helper method to toggle AJAX loader in create project button
    const toggleLoader = (loading: boolean) => {
        createBtn.text = loading ? '' : createLabel();

        // setting text replaces the button's children, so put the spinner back
        createBtn.dom.appendChild(loader.dom);
        loader.hidden = !loading;
    };

    // the shared dialog frame at its large size: kits on the left, the form and footer in a column on the right
    const { overlay, panel, footer } = dialog({ title: 'NEW PROJECT', class: 'picker-project-new', size: 'lg' });

    // main view
    const mainView = new Container({
        class: 'modal-new-project-main-view'
    });
    panel.append(mainView);

    // sidebar
    const sidebar = new Container({
        class: 'modal-new-project-sidebar'
    });
    panel.append(sidebar);

    // form content
    const formContent = new Container({
        class: 'modal-new-project-form-content'
    });
    sidebar.append(formContent);

    // the dialog's footer holds the buttons; it sits under the form on desktop and pins to the sheet on phones
    footer.class.add('create-btn-container');

    const cancelBtn = button({ kind: 'secondary', text: 'Cancel' });
    cancelBtn.on('click', () => {
        overlay.hidden = true;
    });
    footer.append(cancelBtn);

    const createBtn = button({ kind: 'primary', text: 'Create project' });
    footer.append(createBtn);
    const createTooltip = TooltipHandle.make({ root: overlay.dom, ...UNSUPPORTED_TIP, align: 'bottom' });

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
    const loader = spinner({ hidden: true });
    createBtn.dom.appendChild(loader.dom);

    // CONTROLLERS

    const createLabel = () => (forking ? 'Fork project' : 'Create project');

    // handles the flow for project creation as well as managing error and loading states
    const createNewProject = () => {
        const data = newKitData;

        let evt;

        // an empty project has no job: it's ready once the messenger says it was created. listen before
        // creating, so a backend that announces it before the create reply arrives isn't missed
        let createdId: number | null = null;
        const announced = new Map<number, { status?: string; error?: string }>();
        const created = (msg: { status?: string; error?: string }) => {
            evt.unbind();
            toggleLoader(false);
            if (msg.status && msg.status !== 'success') {
                editor.call('picker:project:buildAlert', mainView, msg.error ?? 'Could not create the project');
                return;
            }
            editor.call('picker:project:newProjectConfirmation', createdId);
            overlay.hidden = true; // close new project modal
        };
        if (!data.fork_from) {
            evt = editor.on('messenger:project.create', (msg) => {
                if (createdId === null) {
                    announced.set(msg.project_id, msg);
                } else if (msg.project_id === createdId) {
                    created(msg);
                }
            });
        }

        editor.call(
            'projects:create',
            data,
            (result) => {
                if (!data.fork_from) {
                    createdId = result.id;
                    if (announced.has(createdId)) {
                        created(announced.get(createdId));
                    }
                    return;
                }

                // every other kit is a fork: wait for the fork job, then offer to open the project
                const jobId = result.id;

                evt = editor.on('messenger:job.update', (msg) => {
                    if (!jobId || jobId === msg.job.id) {
                        evt.unbind();

                        // get job
                        // the job's status sits on the job; the fork's id sits in its data
                        service('jobs')
                            .jobGet({ jobId: msg.job.id })
                            .on('load', (status, job) => {
                                if (job.status === 'error') {
                                    editor.call(
                                        'picker:project:buildAlert',
                                        forking ? sidebar : mainView,
                                        job.messages[0]
                                    );
                                } else {
                                    editor.call('picker:project:newProjectConfirmation', job.data.forked_id);
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
    };

    // LOCAL UTILS

    // helper method that determines whether user has rights to make a private project
    const allowPrivate = () => {
        return newProjectOwner.plan_type !== 'free';
    };

    // free accounts can't own a fork of a private project
    const canOwn = (owner) => !forking?.private || owner.plan_type !== 'free';

    // why a project can't be forked, matching playcanvas.com; null when it can
    const forkBlock = (project) => {
        if (project.settings?.useLegacyScripts && !config.self.flags?.hasLegacyScripts) {
            return "This project uses legacy scripts, so it can't be forked.";
        }
        if (project.private_source_assets && project.access_level !== 'write' && project.access_level !== 'admin') {
            const owner = project.owner?.username ?? project.owner ?? 'the owner';
            return `The owner keeps this project's source assets private, so only people who can edit it can fork it. Ask ${owner} for edit access.`;
        }
        if (!canOwn(newProjectOwner)) {
            return UPGRADE_BLOCK;
        }
        return null;
    };

    // helper method to process a project according to required schema
    // EVENTS

    // dialog() reports it open and closed, so hotkeys and the viewport leave it alone
    overlay.on('hide', () => {
        editor.call('picker:project:hideAlerts');
    });

    // the fork dialog is the sidebar alone, without the kit grid
    const setMode = (project) => {
        forking = project;
        panel.headerText = project ? 'FORK PROJECT' : 'NEW PROJECT';
        mainView.hidden = !!project;
        overlay.class[project ? 'add' : 'remove']('fork');
        // the fork form has no kit grid, so it takes the small frame, sized to its content
        overlay.class[project ? 'remove' : 'add']('size-lg');
        overlay.class[project ? 'add' : 'remove']('size-sm');
        createBtn.text = createLabel();
        createBtn.dom.appendChild(loader.dom);
        editor.call('picker:project:hideAlerts');
    };

    // displays the fork dialog for a project; the owner defaults to you, else its organization, else a paid one
    editor.method('picker:project:fork', (project) => {
        editor.call('users:loadOne', config.self.id, (self) => {
            editor.call('projects:getOne', project.id, (full) => {
                rootUser = self;
                setMode(full);
                const orgs = self.organizations ?? [];
                newProjectOwner =
                    [self, orgs.find((o) => o.id === full.owner_id), ...orgs].filter(Boolean).find(canOwn) ?? self;
                Object.assign(formInputs, {
                    name: full.name,
                    description: full.description ?? '',
                    private: !!full.private,
                    fork_from: full.id
                });
                newKitData = { ...formInputs };
                buildSidebar();
                overlay.hidden = false;
            });
        });
    });

    // the projects page's New project: its kit grid fills the main view beside this form
    editor.method('picker:project:new:mainView', () => mainView);

    // opens the form for a new project from a kit; data is what gets created, with the form's values on top
    editor.method('picker:project:new:open', ({ rootUser: root, owner, values, data }) => {
        setMode(null);
        rootUser = root;
        newProjectOwner = owner;
        Object.assign(formInputs, values);
        newKitData = data;
        buildSidebar();
        overlay.hidden = false;
    });

    // a kit was picked: its name, description and source fill the form, and its data is what gets created
    editor.method('picker:project:new:select', (values, data) => {
        Object.assign(formInputs, values);
        newKitData = data;
        buildSidebar();
    });

    editor.method('picker:project:new:values', () => ({ ...formInputs }));
});
