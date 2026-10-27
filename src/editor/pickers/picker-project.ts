import { Button, Container, Element, Label, Overlay, Panel } from '@playcanvas/pcui';

import { bytesToHuman } from '@/common/utils';
import { config } from '@/editor/config';

editor.once('load', () => {
    // GLOBAL VARIABLES
    let projectSettingsListMenu; // used to enable hot reload of sidebar menu text upon project name change
    let currentProject; // used to display project stats
    let currentUser;
    // set by picker:project:open: the menus to show (all when unset), whether to show stats, and the thumbnail
    // controls: always shown, shown while the project settings panel is open, or off (the default)
    let view: { menus?: string[]; stats?: boolean; thumbnails?: 'shown' | 'panel' } = {};
    // whether the picker may close right now; pages set it, e.g. the editor stays open until a scene loads
    let canClose = () => true;
    let alerts = []; // list of alerts
    const EMPTY_THUMBNAIL_IMAGE = `url('${config.url.frontend}static/img/blank-project.webp')`;
    const FULLSCREEN_KEY = 'editor:picker:project:fullscreen';

    // UI

    // build project stats
    let statsContainer;

    // helper method to build alert
    const buildAlert = (root: Container, alert: string, showButton = false, buttonText = '', funcParameters) => {
        const alertContainer = new Container({
            class: 'alert'
        });
        root.dom.appendChild(alertContainer.dom);

        const alertTextContainer = new Container({
            class: 'alert-text'
        });
        const alertInfo = new Element({
            class: 'alert--info'
        });
        const alertText = new Label({
            text: alert
        });
        alertContainer.append(alertTextContainer);
        alertTextContainer.append(alertInfo);
        alertTextContainer.append(alertText);

        if (showButton && buttonText.length > 0) {
            const button = new Button({
                class: 'btn',
                text: buttonText
            });
            alertContainer.append(button);

            button.on('click', () => {
                const callback = funcParameters.errorCallback;
                if (funcParameters.currentUser) {
                    // upgrade number of seats and add collaborator
                    const currentUser = funcParameters.currentUser;
                    editor.call(
                        'users:updateSubscription',
                        config.owner,
                        { seats: currentUser.limits.seats + 1 },
                        () => {
                            currentUser.limits.seats++;
                            editor.call('picker:team:management:createCollaborator');
                        },
                        (status, error) => {
                            if (callback) {
                                callback(status, error);
                            }
                        }
                    );
                } else if (funcParameters.url) {
                    window.open(funcParameters.url, '_self'); // open upgrade screen
                }
            });
        }

        const alertClose = new Button({
            class: 'alert-close'
        });
        alertContainer.append(alertClose);

        alertClose.on('click', () => {
            alertContainer.dom.remove();
        });

        return alertContainer;
    };

    // you can edit the shown project (admin implies write)
    const canWrite = () => currentProject?.access_level === 'write' || currentProject?.access_level === 'admin';

    // fills the frame for the shown project; pages add their own parts on picker:project:refresh
    const refreshUI = () => {
        if (currentProject.thumbnails) {
            projectImg.style.backgroundImage = `url("${currentProject.thumbnails.m}")`;
            deleteButton.hidden = false;
            replaceButton.style.marginRight = '0px';
        } else {
            projectImg.style.backgroundImage = EMPTY_THUMBNAIL_IMAGE;
            // Disable delete thumbnail button if no thumbnails
            deleteButton.hidden = true;
            replaceButton.style.marginRight = '6px';
        }

        // in panel mode the project settings panel shows and hides them
        thumbnailButtons.enabled = !!view.thumbnails;
        if (view.thumbnails !== 'panel') {
            thumbnailButtons.style.opacity = view.thumbnails === 'shown' ? '1' : '0';
        }

        for (const key in menuOptions) {
            if (!menuOptions[key].panelOnly) {
                menuOptions[key].item.hidden = !!view.menus && !view.menus.includes(key);
            }
        }

        if (statsContainer) {
            statsContainer.destroy();
        }
        editor.call('picker:project:main:refreshUI');
        editor.call('picker:team:management:refreshUI');
        buildProjectStatsUI();
        editor.emit('picker:project:refresh', currentProject, view);
    };

    // overlay
    const overlay = new Overlay({
        clickable: true,
        hidden: true,
        class: 'picker-project'
    });

    let closeCallback: (() => boolean) | null = null;
    let suspended = false;
    let suspendClickable = true;
    const originalOnPointerDown = (overlay as any)._onPointerDown;
    (overlay as any)._onPointerDown = (evt: PointerEvent) => {
        if (closeCallback && !closeCallback()) {
            return;
        }
        const target = evt.target as HTMLElement;
        const tooltip = target.closest('.pcui-tooltip');
        if (target.closest('.pcui-menu') || tooltip?.querySelector('.primary-scene-tooltip')) {
            return;
        }
        const targetOverlay = target.closest('.pcui-overlay');
        if (targetOverlay && targetOverlay !== overlay.dom) {
            return;
        }
        originalOnPointerDown(evt);
    };

    const root = editor.call('layout.root');
    root.append(overlay);

    // main panel
    const panel = new Container({
        class: 'project'
    });
    overlay.append(panel);

    // left side panel
    const leftPanel = new Container({
        class: 'left'
    });
    panel.append(leftPanel);

    const projectSummary = new Container({
        class: 'project-summary'
    });
    leftPanel.append(projectSummary);

    // project image
    const projectImg = document.createElement('div');
    projectImg.classList.add('image');
    projectSummary.dom.appendChild(projectImg);

    const projectSummaryText = new Container({
        class: 'project-summary-text'
    });
    projectSummary.append(projectSummaryText);

    const projectTitle = new Label({ class: 'project-name' });
    projectSummaryText.append(projectTitle);

    const buildProjectStatsUI = () => {
        projectTitle.text = currentProject.name;

        statsContainer = new Container({
            id: 'project-stats',
            class: 'project-stats'
        });
        projectSummary.append(statsContainer);

        if (view.stats !== false) {
            const forksLabel = new Label({
                text: `${currentProject.fork_count}`,
                class: 'forks-stat'
            });
            statsContainer.append(forksLabel);

            const viewsLabel = new Label({
                text: `${currentProject.views}`,
                class: 'views-stat'
            });
            statsContainer.append(viewsLabel);
        }

        const sizeLabel = new Label({
            text: bytesToHuman(currentProject.size.total),
            class: 'size-stat'
        });
        statsContainer.append(sizeLabel);
    };

    let uploadingImage = false;

    const uploadProjectImage = function (file: File) {
        if (uploadingImage || currentProject.access_level !== 'admin') {
            return;
        }

        const previousBackgroundImage = projectImg.style.backgroundImage;
        projectImg.style.backgroundImage = `url("${config.url.frontend}static/img/ajax-loader.webp")`;
        projectImg.classList.add('progress');

        uploadingImage = true;

        editor.call(
            'images:upload',
            file,
            currentProject,
            (data) => {
                editor.call(
                    'projects:save',
                    currentProject,
                    { image_url: data.url },
                    () => {
                        uploadingImage = false;
                    },
                    (err) => {
                        // error
                        uploadingImage = false;
                        buildAlert(rightPanel, err);
                        projectImg.style.backgroundImage = previousBackgroundImage;
                        projectImg.classList.remove('progress');
                    }
                );
            },
            (status, data) => {
                // error
                uploadingImage = false;
                buildAlert(rightPanel, data);
                projectImg.style.backgroundImage = previousBackgroundImage;
                projectImg.classList.remove('progress');
            }
        );
    };

    const dropRef = editor.call('drop:target', {
        ref: projectImg,
        filter: function (type: string, data: File[]) {
            return canWrite() && leftPanel.enabled && !uploadingImage && type === 'files';
        },
        drop: function (type: string, data: File[]) {
            if (type !== 'files') {
                return;
            }

            const file = data[0];
            if (!file) {
                return;
            }

            if (!/^image\//.test(file.type)) {
                return;
            }

            uploadProjectImage(file);
        }
    });

    dropRef.class.add('drop-area-project-img');

    // hidden file input to upload project image
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    let currentSelection = null;

    projectImg.addEventListener('click', () => {
        if (
            !canWrite() ||
            !leftPanel.enabled ||
            currentProject.access_level !== 'admin' ||
            currentProject.owner_id !== config.self.id
        ) {
            return;
        }

        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        fileInput.value = null;

        uploadProjectImage(file);

        statsContainer.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.8) 15%, transparent)';
        deleteButton.hidden = false;
        replaceButton.style.marginRight = '0px';
    });

    // store all panels for each menu option
    const menuOptions = {};
    let defaultMenuOption = null;

    // thumbnail buttons
    const thumbnailButtons = new Container({
        class: 'thumbnail-buttons'
    });
    projectSummary.append(thumbnailButtons);
    thumbnailButtons.style.opacity = '0'; // thumbnail buttons start hidden

    const replaceButton = new Button({
        class: 'thumbnail-replace',
        icon: 'E222',
        text: ''
    });
    replaceButton.dom.setAttribute('aria-label', 'Replace project icon');
    replaceButton.dom.setAttribute('title', 'Replace project icon');
    thumbnailButtons.append(replaceButton);

    replaceButton.on('click', () => {
        fileInput.click(); // open file picker
    });

    const deleteButton = new Button({
        class: 'thumbnail-delete',
        icon: 'E124'
    });
    thumbnailButtons.append(deleteButton);

    deleteButton.on('click', () => {
        deleteThumbnail();
        // Hide delete button and adjust margin
        deleteButton.hidden = true;
        replaceButton.style.marginRight = '6px';
    });

    // menu
    const list = new Container({
        dom: 'ul',
        class: ['ui-list', 'selectable']
    });
    leftPanel.dom.appendChild(list.dom);

    // right side panel
    const rightPanel = new Panel({
        headerText: 'Project',
        class: 'right'
    });
    panel.append(rightPanel);

    // close button
    const btnClose = new Button({
        icon: 'E132',
        class: 'close'
    });
    btnClose.on('click', () => {
        if (!closeCallback || closeCallback()) {
            overlay.hidden = true;
        }
    });
    rightPanel.header.append(btnClose);

    // fullscreen toggle — expands the picker to fill the viewport (right of the
    // 40px left toolbar) even when the window is large enough for the small
    // centered picker; hidden by css below the 1060px breakpoint where the
    // picker is force-fullscreen anyway
    let fullscreen = editor.call('localStorage:get', FULLSCREEN_KEY) === true;
    const btnFullscreen = new Button({
        class: 'fullscreen-toggle'
    });
    const applyFullscreen = () => {
        overlay.class[fullscreen ? 'add' : 'remove']('fullscreen');
        btnFullscreen.class[fullscreen ? 'add' : 'remove']('active');
        btnFullscreen.dom.setAttribute('title', fullscreen ? 'Exit fullscreen' : 'Fullscreen');
        // let hosted panels (e.g. version control) resize their panes to the larger viewport
        editor.emit('picker:project:fullscreen', fullscreen);
    };
    btnFullscreen.on('click', () => {
        fullscreen = !fullscreen;
        editor.call('localStorage:set', FULLSCREEN_KEY, fullscreen);
        applyFullscreen();
    });
    rightPanel.header.append(btnFullscreen);
    applyFullscreen();

    // hosted panels read the current state on show (this picker loads before them)
    editor.method('picker:project:isFullscreen', () => fullscreen);

    // LOCAL UTILS

    const deleteThumbnail = () => {
        editor.call('projects:save', currentProject, { image_url: 'blank' }, () => {
            editor.call('picker:projects:deleteImage');
        });
    };

    // activate menu option
    const select = function (name: string) {
        if (!name) {
            return;
        }

        if (currentSelection === name) {
            return;
        }

        currentSelection = name;

        // reset closable state; the page's close rule can still keep it shut
        editor.call('picker:project:setClosable', true);

        // hide all first
        for (const key in menuOptions) {
            menuOptions[key].item.class.remove('active');
            menuOptions[key].panel.hidden = true;
        }

        // show desired option
        menuOptions[name].item.class.add('active');
        menuOptions[name].panel.hidden = false;
        rightPanel.headerText = menuOptions[name].title;
        rightPanel.content.dom.scrollTop = 0;
    };

    // ESC key should close popup
    const onKeyDown = function (e: KeyboardEvent) {
        if (e.target && /input|textarea/i.test(e.target.tagName)) {
            return;
        }

        if (e.keyCode === 27 && overlay.clickable && !editor.call('picker:isOpen', 'conflict-manager')) {
            overlay.hidden = true;
        }
    };

    // EVENTS

    // handle show
    overlay.on('show', () => {
        window.addEventListener('keydown', onKeyDown);

        if (!statsContainer) {
            buildProjectStatsUI();
        }

        projectImg.classList.remove('progress');

        if (canWrite()) {
            projectImg.classList.add('hover');
        } else {
            projectImg.classList.remove('hover');
        }

        // editor-blocking picker open
        editor.emit('picker:open', 'project');
    });

    // handle hide
    overlay.on('hide', () => {
        currentSelection = null;

        // unsubscribe from keydown
        window.removeEventListener('keydown', onKeyDown);

        // hide all panels
        for (const key in menuOptions) {
            menuOptions[key].panel.hidden = true;
            menuOptions[key].item.class.remove('active');
            menuOptions[key].item.class.remove('selected');
            statsContainer.hidden = true;
        }

        view = {};

        // editor-blocking picker closed
        editor.emit('picker:close', 'project');
    });

    // register new panel / menu option
    editor.method('picker:project:registerMenu', (name, title, panel, displayName = '') => {
        const menuItem = new Container({
            dom: 'li',
            class: 'ui-list-item'
        }) as Container & { text: string };
        const menuItemText = document.createElement('span');
        Object.defineProperty(menuItem, 'text', {
            get() {
                return menuItemText.textContent;
            },
            set(value: string) {
                menuItemText.textContent = value;
            }
        });
        menuItem.text = displayName || name;
        menuItem.dom.appendChild(menuItemText);

        if (title === 'PROJECT SETTINGS') {
            projectSettingsListMenu = menuItem;
        }

        menuItem.class.add(name.replace(' ', '-'));
        list.append(menuItem);

        menuItem.on('click', () => {
            select(name);
        });

        menuOptions[name] = {
            item: menuItem,
            title: title,
            panel: panel,
            panelOnly: false
        };
        panel.hidden = true;
        rightPanel.append(panel);
        return menuItem;
    });

    // register panel without a menu option
    editor.method('picker:project:registerPanel', (name, title, panel) => {
        // just do the regular registration but hide the menu
        const item = editor.call('picker:project:registerMenu', name, title, panel);
        menuOptions[name].panelOnly = true;
        item.hidden = true;
        item.class.add('hidden');
        return item;
    });

    // set default menu option
    editor.method('picker:project:setDefaultMenu', (name) => {
        defaultMenuOption = name;
    });

    // shows a project's settings: its owner for the team panel, the menu to open, and which menus and controls to show
    editor.method('picker:project:open', (id: number, ownerId: number, option?: string, options: typeof view = {}) => {
        view = options;
        editor.call('projects:getOne', id, (res) => {
            currentProject = res;
            refreshUI();

            editor.call('users:loadOne', ownerId, (user) => {
                currentUser = user;
                overlay.hidden = false;
            });
        });
        select(option || defaultMenuOption);
    });

    // a check run before clicks outside close the picker, e.g. version control holding it open
    editor.method('picker:project:setCloseGuard', (fn: (() => boolean) | null) => {
        closeCallback = fn;
    });

    // pages add their own buttons, and their own classes
    editor.method('picker:project:leftPanel', () => leftPanel);
    editor.method('picker:project:overlay', () => overlay);

    editor.method('picker:project:setCloseRule', (fn: () => boolean) => {
        canClose = fn;
    });

    // the open menu
    editor.method('picker:project:selected', () => currentSelection);

    // close popup
    editor.method('picker:project:close', () => {
        overlay.hidden = true;
    });

    editor.method('picker:project:suspend', () => {
        if (suspended || overlay.hidden) {
            return;
        }
        suspended = true;
        suspendClickable = overlay.clickable;
        overlay.clickable = false;
        overlay.class.add('vc-suspended');
    });

    editor.method('picker:project:resume', () => {
        if (!suspended) {
            return;
        }
        suspended = false;
        overlay.class.remove('vc-suspended');
        overlay.clickable = suspendClickable;
    });

    // prevent user closing popup; the page's close rule can keep it shut too
    editor.method('picker:project:setClosable', (closable) => {
        const open = closable && canClose();
        btnClose.hidden = !open;
        overlay.clickable = open;
    });

    // disable / enable the state of the left panel
    editor.method('picker:project:toggleLeftPanel', (enabled) => {
        leftPanel.enabled = enabled;
    });

    // disables / enables a menu option on the left
    editor.method('picker:project:toggleMenu', (name, enabled) => {
        menuOptions[name].item.hidden = !enabled;
        if (!enabled) {
            menuOptions[name].panel.hidden = true;
        }
    });

    // hook to retrieve project settings sidebar menu element (to enable hot reloading)
    editor.method('picker:project:updateProjectSettingsMenuItem', (newName) => {
        projectTitle.text = newName;
        projectSettingsListMenu.text = 'Project settings';
    });

    // hook to upload project image
    editor.method('picker:project:uploadImage', (file) => {
        uploadProjectImage(file);
    });

    // hook to delete project image
    editor.method('picker:projects:deleteImage', () => {
        projectImg.style.backgroundImage = EMPTY_THUMBNAIL_IMAGE;
        editor.emit('picker:project:imageDeleted', currentProject);
    });

    // hook to get current project
    editor.method('picker:project:getCurrent', () => {
        return currentProject;
    });

    // hook to get current project owner
    editor.method('picker:project:getOwner', () => {
        return currentUser;
    });

    // hook to build an alert
    editor.method('picker:project:buildAlert', (root, alert, btn, btnText, funcParams) => {
        const newAlert = buildAlert(root, alert, btn, btnText, funcParams);
        alerts.push(newAlert);
    });

    // hook to hide all alerts
    editor.method('picker:project:hideAlerts', () => {
        alerts.forEach((alert) => {
            alert.style.display = 'none';
            alert.destroy();
        });
        alerts = [];
    });

    // hook to display thumbnail controls
    editor.method('picker:project:showThumbnailControls', () => {
        // settings can show before the project has loaded
        if (thumbnailButtons.enabled && currentProject?.access_level === 'admin') {
            thumbnailButtons.style.transform = 'scale(1)';
            thumbnailButtons.style.opacity = '1';
            thumbnailButtons.style.zIndex = '0';
            thumbnailButtons.style.pointerEvents = 'all';
        }
    });

    // hook to hide thumbnail controls
    editor.method('picker:project:hideThumbnailControls', () => {
        if (currentProject.access_level === 'admin') {
            thumbnailButtons.style.transform = 'scale(0.92)';
            thumbnailButtons.style.opacity = '0';
            thumbnailButtons.style.zIndex = '-1';
            thumbnailButtons.style.pointerEvents = 'none';
        }
    });

    // subscribe to project image
    editor.on('messenger:project.image', (data) => {
        projectImg.style.backgroundImage = `url("${data.project.thumbnails && data.project.thumbnails.m}")`;
        projectImg.classList.remove('progress');
    });

    // subscribe to user project image (updates thumbnail on non-opened projects)
    editor.on('messenger:project.user.image', (data) => {
        projectImg.style.backgroundImage = `url("${data.project.thumbnails && data.project.thumbnails.m}")`;
        projectImg.classList.remove('progress');
    });
});
