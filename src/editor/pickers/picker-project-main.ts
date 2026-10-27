import { Element, Container, Label, TextInput, TextAreaInput, BooleanInput } from '@playcanvas/pcui';

import { backend, UNSUPPORTED_TIP } from '@/common/backend';
import { TooltipHandle } from '@/common/tooltips';
import { config } from '@/editor/config';

import { button } from './project-management/components/button';

const DAY_MS = 86400000;
const COPIED_MS = 1500;
const ACTIVITY_DAYS = 28;
const ACTIVITY_SLOTS = 288; // five-minute slots in a day, the unit the activity levels count
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

editor.once('load', () => {
    // global variables
    let initialLoad = true;
    let projectSettingsChanged = false;
    let events = []; // holds events that need to be destroyed
    const IS_EMPTY_STATE = !config.project.id;
    // the api project carries more fields (access level, owner, fork source) than the editor config's
    let currentProject: (typeof config.project & Record<string, unknown>) | null = IS_EMPTY_STATE
        ? null
        : config.project;
    let projectSettings = {
        id: IS_EMPTY_STATE ? -1 : currentProject.id,
        name: IS_EMPTY_STATE ? '' : currentProject.name,
        description: IS_EMPTY_STATE ? '' : currentProject.description,
        private: IS_EMPTY_STATE ? false : currentProject.private
    };

    // UI

    const getExportButtonText = () => {
        const isCurrentProject = currentProject && currentProject.id === config.project.id;
        const hasVersionControl = isCurrentProject && !config.project.settings.useLegacyScripts;
        if (hasVersionControl) {
            return `Export Project (${config.self.branch.name})`;
        }
        return 'Export Project';
    };

    // displays or hides the AJAX loader UI when exporting project
    const toggleLoader = (toggle) => {
        if (toggle) {
            exportProjectButton.text = '';
            exportProjectButton.dom.setAttribute('data-icon', '');
            loader.style.display = 'block';
        } else {
            loader.style.display = 'none';
            exportProjectButton.text = getExportButtonText();
            exportProjectButton.icon = 'E228';
        }
    };

    // helper method to determine whether the current user is an admin
    const isAdmin = () => {
        return currentProject ? currentProject.access_level === 'admin' : false;
    };

    // main panel
    const panel = new Container({
        class: 'picker-project-main'
    });

    // register panel with project popup
    editor.call('picker:project:registerMenu', 'project-main', 'PROJECT SETTINGS', panel, 'Project settings');

    // hide button if the user doesn't have the right permissions
    if (!editor.call('permissions:read')) {
        editor.call('picker:project:toggleMenu', 'project-main', false);
    }

    // if the user permissions change, then change the visibility of the button
    editor.on('permissions:set', () => {
        editor.call('picker:project:toggleMenu', 'project-main', editor.call('permissions:read'));
    });

    // locked UI
    const lockedContainer = new Container({
        class: 'locked-container',
        flex: true
    });
    panel.append(lockedContainer);

    const lockedText = new Label({
        class: 'locked-text'
    });
    lockedContainer.append(lockedText);

    // personal plans unlock by dropping members without a subscription; other plans unlock by going public
    const setLockedText = (owner) => {
        const upgrade = `<a href="${config.url.home}/upgrade?account=${encodeURIComponent(owner?.username ?? '')}" target="_blank">UPGRADE</a>`;
        lockedText.dom.innerHTML =
            owner?.plan_type === 'personal'
                ? "This project is locked. Unlocking it removes everyone who doesn't have a PlayCanvas subscription."
                : `This project is locked. Unlocking this project will make it public. Another way of unlocking is to ${upgrade}`;
    };

    // unlocking and deleting need the backend's project management
    const managed = !!backend().projectManagement;
    const unlockButton = button({ kind: 'primary', icon: 'E340', text: 'Unlock' });
    lockedContainer.append(unlockButton);
    if (!managed) {
        TooltipHandle.attach({ target: unlockButton.dom, ...UNSUPPORTED_TIP, align: 'bottom' });
    }
    lockedContainer.style.display = 'none'; // hide by default

    unlockButton.on('click', () => {
        editor.call(
            'projects:unlockOne',
            currentProject.id,
            () => {
                editor.emit('projects:changed');
                editor.call('picker:project:close');
            },
            (err) => {
                editor.call('picker:project:buildAlert', panel, err);
            }
        );
    });

    // project settings container
    const settingsContainer = new Container({
        class: 'project-settings',
        flex: true
    });
    panel.append(settingsContainer);

    // project name group
    const projectNameGroup = new Container({
        flex: true,
        class: 'settings-group'
    });
    settingsContainer.append(projectNameGroup);

    const projectNameLabel = new Label({
        text: 'Name'
    });
    projectNameGroup.append(projectNameLabel.dom);
    const projectNameInput = new TextInput({
        enabled: isAdmin(),
        class: 'form-input',
        value: projectSettings.name,
        renderChanges: true,
        keyChange: true
    });
    projectNameGroup.append(projectNameInput.dom);

    projectNameInput.on('change', () => {
        const newValue = projectNameInput.value;
        if (projectNameInput.value.length > 32) {
            projectNameInput.value = newValue.slice(0, -2);
        } // do not allow more than 32 character names
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
    const projectDescGroup = new Container({
        flex: true,
        class: 'settings-group'
    });
    settingsContainer.append(projectDescGroup);

    const projectDescLabel = new Label({
        text: 'Description'
    });
    projectDescGroup.append(projectDescLabel.dom);
    const projectDescInput = new TextAreaInput({
        enabled: isAdmin(),
        class: 'form-input',
        value: projectSettings.description,
        renderChanges: true,
        height: 150
    });

    projectDescInput.on('change', () => {
        // filling the form for a project isn't a change
        if (initialLoad) {
            return;
        }
        projectSettingsChanged = true;
        const descriptionBefore = projectSettings.description;
        projectSettings.description = projectDescInput.value;
        saveProject({ description: descriptionBefore }, initialLoad);
    });

    projectDescInput.dom.id = 'description';
    projectDescGroup.append(projectDescInput.dom);

    // private settings container
    const privateSettings = new Element({
        class: 'horizontal-container'
    });
    settingsContainer.append(privateSettings.dom);

    const privateLabel = new Label({
        text: 'Private Project'
    });
    privateSettings.dom.appendChild(privateLabel.dom);

    const privateToggle = new BooleanInput({
        enabled: isAdmin() && editor.call('users:allowPrivate', config.owner),
        type: 'toggle',
        value: projectSettings.private
    });

    privateToggle.on('click', () => {
        if (initialLoad) {
            return;
        }
        editor.call('picker:project:changeVisibility', privateToggle.value ? 'Private' : 'Public');
    });
    privateSettings.dom.appendChild(privateToggle.dom);

    // only shown when the project already keeps its source assets private; admins can turn it off
    const privateAssetsSettings = new Element({
        class: 'horizontal-container',
        hidden: true
    });
    settingsContainer.append(privateAssetsSettings.dom);
    privateAssetsSettings.dom.appendChild(new Label({ text: 'Private Source Assets' }).dom);
    const privateAssetsToggle = new BooleanInput({ type: 'toggle' });
    privateAssetsSettings.dom.appendChild(privateAssetsToggle.dom);
    privateAssetsToggle.on('change', (value) => {
        if (initialLoad || value === !!currentProject.private_source_assets) {
            return;
        }
        projectSettingsChanged = true;
        editor.call(
            'projects:save',
            currentProject,
            { private_source_assets: value },
            () => {
                currentProject.private_source_assets = value;
            },
            (err) => {
                editor.call('picker:project:buildAlert', panel, `SAVE ERROR: ${err}`);
                initialLoad = true;
                privateAssetsToggle.value = !value;
                initialLoad = false;
            }
        );
    });

    // links to the project this one was forked from, when the caller can see it
    const forkedFromSettings = new Element({
        class: ['horizontal-container', 'forked-from'],
        hidden: true
    });
    settingsContainer.append(forkedFromSettings.dom);
    forkedFromSettings.dom.appendChild(new Label({ text: 'Forked From' }).dom);
    // the project name links to it, with its owner after
    const forkedFromValue = document.createElement('div');
    forkedFromValue.className = 'forked-from-value';
    forkedFromSettings.dom.appendChild(forkedFromValue);
    const forkedFromLink = document.createElement('a');
    forkedFromLink.target = '_blank';
    forkedFromValue.appendChild(forkedFromLink);
    const forkedFromOwner = document.createElement('div');
    forkedFromOwner.className = 'forked-from-owner';
    forkedFromValue.appendChild(forkedFromOwner);

    // the last four weeks of editing as a calendar, a column per weekday, brighter for busier days
    const activitySettings = new Element({
        class: ['horizontal-container', 'activity'],
        hidden: true
    });
    settingsContainer.append(activitySettings.dom);
    activitySettings.dom.appendChild(new Label({ text: 'Activity' }).dom);
    const activityCalendar = document.createElement('div');
    activityCalendar.className = 'activity-calendar';
    activitySettings.dom.appendChild(activityCalendar);

    const renderActivity = (items: { day: number; level: number }[]) => {
        const first = Math.floor(Date.now() / DAY_MS) - (ACTIVITY_DAYS - 1);
        const levels = new Map(items.map((item) => [item.day, item.level]));

        // blanks before the first day line it up under its weekday, monday first
        const offset = (new Date(first * DAY_MS).getUTCDay() + 6) % 7;
        activityCalendar.replaceChildren(
            ...WEEKDAYS.map((name) => {
                const label = document.createElement('span');
                label.textContent = name;
                return label;
            }),
            ...Array.from({ length: offset }, () => document.createElement('i')),
            ...Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
                const day = first + i;
                const level = levels.get(day) ?? 0;
                const minutes = level * 5;
                const cell = document.createElement('div');
                cell.className = level ? 'active' : '';
                cell.style.opacity = level ? String(0.25 + 0.75 * Math.min(1, level / ACTIVITY_SLOTS)) : '';
                cell.title = `${new Date(day * DAY_MS).toLocaleDateString()}: ${
                    !level ? 'no editing' : minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 60)} h`
                }`;
                return cell;
            })
        );
    };

    // action buttons container
    const actionButtonsContainer = new Container({
        class: 'action-buttons',
        flex: true
    });
    panel.append(actionButtonsContainer);

    // copy link, an icon button beside fork
    const copyLinkButton = button({ kind: 'icon', label: 'Copy link', class: 'copy-link-button' });
    actionButtonsContainer.append(copyLinkButton);
    copyLinkButton.on('click', () => {
        navigator.clipboard.writeText(`${config.url.home}/editor/project/${currentProject.id}`).then(
            () => {
                copyLinkButton.class.add('copied');
                copyLinkButton.dom.title = 'Copied';
                setTimeout(() => {
                    copyLinkButton.class.remove('copied');
                    copyLinkButton.dom.title = 'Copy link';
                }, COPIED_MS);
            },
            () => {
                // intentionally empty
            }
        );
    });

    const forkProjectButton = button({ kind: 'secondary', icon: 'E431', text: 'Fork Project' });
    actionButtonsContainer.append(forkProjectButton);
    forkProjectButton.on('click', () => {
        editor.call('picker:project:fork', currentProject);
    });

    const exportProjectButtonContainer = new Container({ flex: true });
    actionButtonsContainer.append(exportProjectButtonContainer);

    // export project button
    const exportProjectButton = button({ kind: 'secondary', icon: 'E228', text: getExportButtonText() });
    exportProjectButtonContainer.append(exportProjectButton);
    exportProjectButton.dom.dataset.action = 'project-export';

    const exportable = !!(backend().projectExport && backend().jobs);
    if (!exportable) {
        TooltipHandle.attach({ target: exportProjectButton.dom, ...UNSUPPORTED_TIP, align: 'bottom' });
    }

    const loader = new Element({
        class: ['loader', 'xsmall', 'white']
    });
    loader.style.display = 'none';
    exportProjectButtonContainer.append(loader);

    exportProjectButton.on('click', () => {
        toggleLoader(true);
        exportProject();
    });

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
        const isCurrentProject = currentProject && currentProject.id === config.project.id;
        const hasVersionControl = isCurrentProject && !config.project.settings.useLegacyScripts;
        const branchId = hasVersionControl ? config.self.branch.id : undefined;

        editor
            .call('project:management:export', currentProject.id, branchId)
            .then(
                (url) => window.open(url, '_blank'),
                (err) => editor.call('picker:project:buildAlert', panel, err)
            )
            .finally(() => toggleLoader(false));
    };

    // LOCAL UTILS

    const exportDisabled = () => !exportable || !editor.call('project:management:canExport', currentProject);

    // helper method to delete all outstanding events on close
    const destroyEvents = () => {
        events.forEach((evt) => {
            if (evt) {
                evt.unbind();
            }
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
    });

    // on hide
    panel.on('hide', () => {
        destroyEvents();

        if (projectSettingsChanged) {
            editor.emit('projects:changed');
        }

        editor.call('picker:project:hideAlerts');
        editor.call('picker:project:hideThumbnailControls');
        projectSettingsChanged = false;
    });

    // the footer, so pages can add their own actions
    editor.method('picker:project:main:actions', () => actionButtonsContainer);

    // show the main project picker
    editor.method('picker:project:main', () => {
        exportProjectButton.enabled = !exportDisabled();
        editor.call('picker:project', 'project-main');
    });

    // hook to reload all main elements of the screen
    editor.method('picker:project:main:refreshUI', () => {
        currentProject = editor.call('picker:project:getCurrent');
        unlockButton.enabled =
            managed &&
            (currentProject.owner_id === config.self.id ||
                editor.call('project:management:isOrgAdmin', currentProject.owner_id, config.self));

        projectSettings = {
            id: currentProject.id,
            name: currentProject.name,
            description: currentProject.description,
            private: currentProject.private
        };
        editor.call('picker:project:updateProjectSettingsMenuItem', currentProject.name);

        // only show locked view if locked project
        if (currentProject.locked) {
            setLockedText(null);
            editor.call('users:loadOne', currentProject.owner_id, (owner) => {
                if (owner.id === editor.call('picker:project:getCurrent')?.owner_id) {
                    setLockedText(owner);
                }
            });
            lockedContainer.style.display = 'flex';
            settingsContainer.style.display = 'none';
        } else {
            // only show settings container if not locked project
            settingsContainer.style.display = 'flex';
            lockedContainer.style.display = 'none';
        }

        projectNameInput.enabled = isAdmin();
        projectDescInput.enabled = isAdmin();
        privateToggle.enabled = isAdmin();

        initialLoad = true;

        projectNameInput.value = currentProject.name;
        projectDescInput.value = currentProject.description;
        privateToggle.value = currentProject.private;

        exportProjectButton.enabled = !exportDisabled();
        exportProjectButton.text = getExportButtonText();

        forkProjectButton.hidden = !!currentProject.locked;
        copyLinkButton.hidden = !!currentProject.locked;

        privateAssetsSettings.hidden = !currentProject.private_source_assets;
        privateAssetsToggle.value = !!currentProject.private_source_assets;
        privateAssetsToggle.enabled = isAdmin();

        activitySettings.hidden = true;
        if (currentProject.access_level !== 'none') {
            const id = currentProject.id;
            editor.call('projects:activity', id, (data) => {
                if (id === currentProject.id) {
                    renderActivity(data.result ?? []);
                    activitySettings.hidden = false;
                }
            });
        }

        forkedFromSettings.hidden = !currentProject.fork_from_name;
        forkedFromLink.textContent = String(currentProject.fork_from_name ?? '');
        forkedFromOwner.textContent = currentProject.fork_from_username
            ? `by ${currentProject.fork_from_username}`
            : '';
        forkedFromLink.href = `${config.url.home}/editor/project/${currentProject.fork_from}`;

        initialLoad = false; // once initial load happens, reset flag

        // the panel opened before the project loaded, so show the thumbnail controls now
        if (!panel.hidden) {
            editor.call('picker:project:showThumbnailControls');
        }
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
