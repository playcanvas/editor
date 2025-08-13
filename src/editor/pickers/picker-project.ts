import { Element, Container, Label, Button } from '@playcanvas/pcui';

import { LegacyButton } from '../../common/ui/button.ts';
import { LegacyListItem } from '../../common/ui/list-item.ts';
import { LegacyList } from '../../common/ui/list.ts';
import { LegacyOverlay } from '../../common/ui/overlay.ts';
import { LegacyPanel } from '../../common/ui/panel.ts';
import { bytesToHuman } from '../../common/utils.ts';

editor.once('load', () => {
    // GLOBAL VARIABLES
    let projectSettingsListMenu;  // used to enable hot reload of sidebar menu text upon project name change
    let currentProject;  // used to display project stats
    let currentUser;
    let cmsView;  // general CMS view
    let reducedView;  // alternative CMS view
    let noAdminView;  // alternative 'none' access level view
    let lockedView;  // alternative locked view
    let alerts = [];  // list of alerts

    const IS_EMPTY_STATE = !config.project.id;
    const EMPTY_THUMBNAIL_IMAGE = 'url(\'/static/platform/images/home/blank_project.png\')';

    // UI

    // build project stats
    let statsContainer;
    const buildProjectStatsUI = () => {
        statsContainer = new Container({
            class: 'project-stats'
        });
        statsContainer.element.id = 'project-stats';
        leftPanel.append(statsContainer);

        if (!noAdminView) {
            // Forks
            const forksLabel = new Label({
                text: `${currentProject.fork_count}`,
                class: 'forks-stat'
            });
            statsContainer.append(forksLabel);

            // Views
            const viewsLabel = new Label({
                text: `${currentProject.views}`,
                class: 'views-stat'
            });
            statsContainer.append(viewsLabel);

            // Plays
            const playsLabel = new Label({
                text: `${currentProject.plays}`,
                class: 'plays-stat'
            });
            statsContainer.append(playsLabel);
        }

        // Size
        const sizeLabel = new Label({
            text: bytesToHuman(currentProject.size.total),
            class: 'size-stat'
        });
        statsContainer.append(sizeLabel);
    };

    // helper method to build alert
    const buildAlert = (root, alert, showButton = false, buttonText = '', funcParameters) => {
        const alertContainer = new Element({
            class: 'alert'
        });
        root.dom.appendChild(alertContainer.dom);

        const alertTextContainer = new Element({
            class: 'alert-text'
        });
        const alertInfo = new Element({
            class: 'alert--info'
        });
        const alertText = new Label({
            text: alert
        });
        alertContainer.dom.appendChild(alertTextContainer.dom);
        alertTextContainer.dom.appendChild(alertInfo.dom);
        alertTextContainer.dom.appendChild(alertText.element);

        if (showButton && buttonText.length > 0) {
            const button = new Button({
                class: 'btn',
                text: buttonText
            });
            alertContainer.dom.appendChild(button.element);

            button.on('click', () => {
                const callback = funcParameters.errorCallback;
                if (funcParameters.currentUser) {
                    // upgrade number of seats and add collaborator
                    const currentUser = funcParameters.currentUser;
                    editor.call('users:updateSubscription', config.owner, { seats: currentUser.limits.seats + 1 }, () => {
                        currentUser.limits.seats++;
                        editor.call('picker:team:management:createCollaborator');
                    }, (status, error) => {
                        if (callback) {
                            callback(status, error);
                        }
                    });

                } else if (funcParameters.url) {
                    window.open(funcParameters.url, '_self');  // open upgrade screen
                }
            });
        }

        const alertClose = new Button({
            class: 'alert-close'
        });
        alertContainer.dom.appendChild(alertClose.element);

        alertClose.on('click', () => {
            alertContainer.dom.remove();
        });

        return alertContainer;
    };

    // helper method to refresh project-specific UI components depending on current view
    const refreshUI = () => {
        if (currentProject.thumbnails) {
            projectImg.style.backgroundImage = `url("${currentProject.thumbnails.m}")`;
            deleteButton.hidden = false;
            replaceButton.element.style.marginRight = '0px';
        } else {
            projectImg.style.backgroundImage = EMPTY_THUMBNAIL_IMAGE;
            // Disable delete thumbnail button if no thumbnails
            deleteButton.hidden = true;
            replaceButton.element.style.marginRight = '6px';
        }

        if (reducedView) {
            btnClose.hidden = false;  // show close button for modal

            overlay.class.add('reduced-view');

            // if not admin, don't display thumbnail controls
            thumbnailButtons.enabled = (currentProject.access_level === 'admin' && currentProject.owner_id === config.self.id) || currentProject.id === config.project.id;
            thumbnailButtons.style.opacity = (currentProject.access_level === 'admin' && currentProject.owner_id === config.self.id) || currentProject.id === config.project.id ? '1' : '0';

            menuOptions.scenes.item.hidden = true;
            if (!IS_EMPTY_STATE) {
                menuOptions['builds-publish'].item.hidden = true;
                menuOptions['version control'].item.hidden = true;
            }

            // ensure all reduced view panels are visible
            for (const key in menuOptions) {
                if (key === 'project-main' || key === 'team') {
                    menuOptions[key].item.hidden = false;
                }
            }

            projectCMSButton.enabled = false;
            projectCMSButton.hidden = true;

            editorBtn.enabled = true;
            editorBtn.hidden = false;

            playBtn.hidden = false;
            playBtn.enabled = currentProject.primary_app_url;
        } else if (noAdminView) {
            btnClose.hidden = false;

            // hide and disable thumbnail controls
            thumbnailButtons.enabled = false;
            thumbnailButtons.style.opacity = '0';

            menuOptions['project-main'].item.hidden = true;
            menuOptions.scenes.item.hidden = true;
            if (menuOptions['builds-publish']) {
                menuOptions['builds-publish'].item.hidden = true;
            }
            if (menuOptions['version control']) {
                menuOptions['version control'].item.hidden = true;
            }

            // ensure only team management panel is visible
            menuOptions.team.item.hidden = false;

            projectCMSButton.enabled = false;
            projectCMSButton.hidden = true;

            editorBtn.enabled = false;
            editorBtn.hidden = true;

            playBtn.hidden = true;
            playBtn.enabled = false;

        } else if (lockedView) {
            btnClose.hidden = false;

            // hide and disable thumbnail controls
            thumbnailButtons.enabled = false;
            thumbnailButtons.style.opacity = '0';

            menuOptions['project-main'].item.hidden = false;
            menuOptions.scenes.item.hidden = true;
            menuOptions.team.item.hidden = true;
            if (menuOptions['builds-publish']) {
                menuOptions['builds-publish'].item.hidden = true;
            }
            if (menuOptions['version control']) {
                menuOptions['version control'].item.hidden = true;
            }

            projectCMSButton.enabled = false;
            projectCMSButton.hidden = true;

            editorBtn.enabled = false;
            editorBtn.hidden = true;

            playBtn.hidden = true;
            playBtn.enabled = false;
        } else {
            overlay.class.remove('reduced-view');

            // if admin, enable thumbnail controls
            thumbnailButtons.enabled = (currentProject.access_level === 'admin' && currentProject.owner_id === config.self.id) || currentProject.id === config.project.id;

            projectCMSButton.enabled = true;
            projectCMSButton.hidden = false;

            editorBtn.hidden = true;
            editorBtn.enabled = false;

            playBtn.hidden = true;
            playBtn.enabled = false;

            // ensure all panels are visible
            for (const key in menuOptions) {
                if (key !== 'publish-download' && key !== 'publish-new') {
                    menuOptions[key].item.hidden = false;
                }
            }
            editor.call('picker:project:main:cmsView');
        }

        if (statsContainer) {
            statsContainer.element.remove();
        }
        editor.call('picker:project:main:refreshUI');
        editor.call('picker:team:management:refreshUI');
        buildProjectStatsUI();
    };

    // overlay
    var overlay = new LegacyOverlay();
    overlay.class.add('picker-project');
    overlay.clickable = true;
    overlay.hidden = true;

    const root = editor.call('layout.root');
    root.append(overlay);

    // main panel
    const panel = new LegacyPanel();
    panel.class.add('project');
    overlay.append(panel);

    // left side panel
    var leftPanel = new LegacyPanel();
    panel.append(leftPanel);
    leftPanel.class.add('left');

    // project image
    var projectImg = document.createElement('div');
    projectImg.classList.add('image');
    if (!IS_EMPTY_STATE) {
        projectImg.style.backgroundImage = config.project.thumbnails.m ? `url("${config.project.thumbnails.m}")` : EMPTY_THUMBNAIL_IMAGE;
    }
    leftPanel.append(projectImg);

    let uploadingImage = false;

    const uploadProjectImage = function (file) {
        if ((!IS_EMPTY_STATE && !editor.call('permissions:write')) || uploadingImage || currentProject.access_level !== 'admin') {
            return;
        }

        const previousBackgroundImage = projectImg.style.backgroundImage;
        projectImg.style.backgroundImage = `url("${config.url.static}/platform/images/common/ajax-loader.gif")`;
        projectImg.classList.add('progress');

        uploadingImage = true;

        editor.call('images:upload', file, currentProject, (data) => {
            editor.call('projects:save', currentProject, { image_url: data.url }, () => {
                uploadingImage = false;
            }, (err) => {
                // error
                uploadingImage = false;
                buildAlert(rightPanel, err);
                projectImg.style.backgroundImage = previousBackgroundImage;
                projectImg.classList.remove('progress');
            });
        }, (status, data) => {
            // error
            uploadingImage = false;
            buildAlert(rightPanel, data);
            projectImg.style.backgroundImage = previousBackgroundImage;
            projectImg.classList.remove('progress');
        });
    };

    const dropRef = editor.call('drop:target', {
        ref: projectImg,
        filter: function (type, data) {
            return editor.call('permissions:write') &&
                   !leftPanel.disabled &&
                   !uploadingImage &&
                   type === 'files';
        },
        drop: function (type, data) {
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
        if (!editor.call('permissions:write') || leftPanel.disabled || currentProject.access_level !== 'admin' || currentProject.owner_id !== config.self.id) {
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
        replaceButton.element.style.marginRight = '0px';
    });

    // store all panels for each menu option
    var menuOptions = {};
    let defaultMenuOption = null;

    // thumbnail buttons
    const thumbnailButtons = new Container({
        class: 'thumbnail-buttons'
    });
    leftPanel.append(thumbnailButtons);
    thumbnailButtons.style.opacity = '0';  // thumbnail buttons start hidden

    const replaceButton = new Button({
        class: 'thumbnail-replace',
        icon: 'E222',
        text: 'REPLACE'
    });
    thumbnailButtons.append(replaceButton);

    replaceButton.on('click', () => {
        fileInput.click();  // open file picker
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
        replaceButton.element.style.marginRight = '6px';
    });

    // menu
    const list = new LegacyList();
    leftPanel.append(list);

    // project CMS button
    const projectCMSButton = new Button({
        class: 'project-cms-button',
        text: 'See all projects',
        enabled: !reducedView,
        hidden: reducedView
    });
    leftPanel.append(projectCMSButton);

    projectCMSButton.on('click', () => {
        if (cmsView) {
            editor.call('picker:project:cms:close');

            if (!config.scene.id) {
                editor.call('picker:project');
            } else {
                overlay.hidden = true;
            }
        } else {
            editor.call('picker:project:cms');
            overlay.hidden = true;
        }
    });

    // editor CMS button
    const editorBtn = new Button({
        class: 'cms-editor-button',
        icon: 'E294',
        text: 'EDITOR',
        enabled: reducedView,
        hidden: !reducedView
    });
    leftPanel.append(editorBtn);

    editorBtn.element.addEventListener('mousedown', (e) => {
        let target = '_self';
        if (e.which === 2 || e.button === 4 || e.metaKey || e.ctrlKey) {
            target = '_blank';
        }  // If middle click, open in new tab

        let url = `${config.url.home}/editor/project/${currentProject.id}`;
        if (location.search.includes('use_local_frontend')) {
            url += '?use_local_frontend';
        }

        window.open(url, target);
    });

    // launch button
    const playBtn = new Button({
        class: 'cms-play-button',
        icon: 'E131',
        text: 'PLAY',
        enabled: reducedView && currentProject.primary_app_url,
        hidden: !reducedView
    });
    leftPanel.append(playBtn);

    playBtn.on('click', () => {
        window.open(currentProject.primary_app_url, '_blank');
    });

    // right side panel
    const rightPanel = new LegacyPanel('Project');
    panel.append(rightPanel);
    rightPanel.class.add('right');

    // close button
    const btnClose = new LegacyButton({
        text: '&#57650;'
    });
    btnClose.class.add('close');
    btnClose.on('click', () => {
        if (currentSelection !== 'version control' || editor.call('vcgraph:isHidden')) {
            overlay.hidden = true;
        }
    });
    rightPanel.headerElement.appendChild(btnClose.element);

    // LOCAL UTILS

    const deleteThumbnail = () => {
        editor.call('projects:save', currentProject, { image_url: 'blank' }, () => {
            editor.call('picker:projects:deleteImage');
        });
    };

    // activate menu option
    const select = function (name) {
        if (!name) {
            return;
        }

        if (currentSelection === name) {
            return;
        }

        currentSelection = name;

        // if this is not a scene URL and not in reduced CMS view, disallow closing the popup
        if (!IS_EMPTY_STATE && !config.scene.id && !reducedView && !noAdminView) {
            editor.call('picker:project:setClosable', false);
        } else {
            // reset closable state
            editor.call('picker:project:setClosable', true);
        }

        // hide all first
        for (const key in menuOptions) {
            menuOptions[key].item.class.remove('active');
            menuOptions[key].panel.hidden = true;
        }

        // show desired option
        menuOptions[name].item.class.add('active');
        menuOptions[name].panel.hidden = false;
        rightPanel.headerElementTitle.textContent = menuOptions[name].title;
        rightPanel.innerElement.scrollTop = 0;
    };

    // ESC key should close popup
    const onKeyDown = function (e) {
        if (e.target && /input|textarea/i.test(e.target.tagName)) {
            return;
        }

        if (e.keyCode === 27 && overlay.clickable) {
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
        if (!IS_EMPTY_STATE) {
            projectImg.style.backgroundImage = config.project.thumbnails.m ? `url("${config.project.thumbnails.m}")` : EMPTY_THUMBNAIL_IMAGE;
        }

        if (editor.call('permissions:write')) {
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

        // reset flags
        noAdminView = false;
        reducedView = false;
        lockedView = false;

        // editor-blocking picker closed
        editor.emit('picker:close', 'project');
    });

    // register new panel / menu option
    editor.method('picker:project:registerMenu', (name, title, panel, displayName = '') => {
        let menuItem;
        if (displayName.length > 0) {
            menuItem = new LegacyListItem({ text: displayName });
        } else {
            menuItem = new LegacyListItem({ text: name });
        }

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
            panel: panel
        };
        panel.hidden = true;
        rightPanel.append(panel);
        return menuItem;
    });

    // register panel without a menu option
    editor.method('picker:project:registerPanel', (name, title, panel) => {
        // just do the regular registration but hide the menu
        const item = editor.call('picker:project:registerMenu', name, title, panel);
        item.class.add('hidden');
        return item;
    });

    // set default menu option
    editor.method('picker:project:setDefaultMenu', (name) => {
        defaultMenuOption = name;
    });

    // open popup
    editor.method('picker:project', (option, cms = false) => {
        editor.call('projects:getOne', config.project.id, (res) => {
            currentProject = res;
            cmsView = cms;

            refreshUI();

            if (cmsView) {
                btnClose.hidden = false;  // display close button
                overlay.class.add('cmsView');
                projectCMSButton.text = 'Return to Project';
            } else {
                projectCMSButton.text = 'See all projects';
            }

            editor.call('users:loadOne', config.owner.id, (user) => {
                currentUser = user;
                overlay.hidden = false;
            });
        });

        if (option === 'version control') {
            overlay.setCloseCallback(() => editor.call('vcgraph:isHidden'));
        } else {
            overlay.setCloseCallback(null);
        }

        select(option || defaultMenuOption);
    });

    // open reduced functionality popup
    editor.method('picker:project:reduced', (project) => {
        editor.call('projects:getOne', project.id, (res) => {
            currentProject = res;
            reducedView = true;

            editor.call('users:loadOne', config.self.id, (user) => {
                currentUser = user;  // change this variable name
                overlay.hidden = false;
            });

            refreshUI();

            select('project-main');  // select project settings panel
        });
    });

    // open no admin popup
    editor.method('picker:project:noAdmin', (project) => {
        overlay.class.add('noAdminView');
        editor.call('projects:getOne', project.id, (res) => {
            currentProject = res;
            noAdminView = true;

            editor.call('users:loadOne', config.self.id, (user) => {
                currentUser = user;  // change this variable name
                overlay.hidden = false;
            });

            refreshUI();
            btnClose.hidden = false;

            select('team');  // select project settings panel
        });
    });

    // open locked view popup
    editor.method('picker:project:lockedView', (project) => {
        overlay.class.add('noAdminView');
        editor.call('projects:getOne', project.id, (res) => {
            currentProject = res;
            lockedView = true;

            editor.call('users:loadOne', config.self.id, (user) => {
                currentUser = user;
                overlay.hidden = false;
            });

            refreshUI();
            btnClose.hidden = false;

            select('project-main');  // select main project panel
            thumbnailButtons.style.opacity = '0';
        });
    });

    // helper method to determine whether no admin view should be displayed
    editor.method('picker:project:showNoAdmin', (project, collaborators) => {
        let userIsCollaborator = false;
        collaborators.forEach((collaborator) => {
            if (collaborator.id === currentUser.id) {
                userIsCollaborator = true;
            }
        });
        return editor.call('project:management:isOrgAdmin', project.owner_id, currentUser) &&
            !project.locked &&
            collaborators.length >= 0 &&
            !userIsCollaborator;
    });

    // close popup
    editor.method('picker:project:close', () => {
        overlay.class.remove('cmsView');
        overlay.class.remove('noAdminView');
        overlay.hidden = true;
    });

    // prevent user closing popup
    editor.method('picker:project:setClosable', (closable) => {
        btnClose.hidden = !closable;
        overlay.clickable = closable;
    });

    // disable / enable the state of the left panel
    editor.method('picker:project:toggleLeftPanel', (enabled) => {
        leftPanel.disabled = !enabled;
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
        projectSettingsListMenu.text = newName;
    });

    // hook to upload project image
    editor.method('picker:project:uploadImage', (file) => {
        uploadProjectImage(file);
    });

    // hook to delete project image
    editor.method('picker:projects:deleteImage', () => {
        config.project.thumbnails = {};
        projectImg.style.backgroundImage = EMPTY_THUMBNAIL_IMAGE;
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
            alert.dom.style.display = 'none';
            alert.destroy();
        });
        alerts = [];
    });

    // hook to display thumbnail controls
    editor.method('picker:project:showThumbnailControls', () => {
        if (currentProject.access_level === 'admin') {
            thumbnailButtons.style.transform = 'translate(0, 0px)';
            thumbnailButtons.style.opacity = '1';
            thumbnailButtons.style.zIndex = '0';
            thumbnailButtons.style.pointerEvents = 'all';
        }
    });

    // hook to hide thumbnail controls
    editor.method('picker:project:hideThumbnailControls', () => {
        if (currentProject.access_level === 'admin') {
            thumbnailButtons.style.transform = 'translate(0, 32px)';
            thumbnailButtons.style.opacity = '0';
            thumbnailButtons.style.zIndex = '-1';
            thumbnailButtons.style.pointerEvents = 'none';
        }
    });

    // subscribe to project image
    editor.on('messenger:project.image', (data) => {
        config.project.thumbnails = data.project.thumbnails;
        projectImg.style.backgroundImage = `url("${data.project.thumbnails && data.project.thumbnails.m}")`;
        projectImg.classList.remove('progress');
    });

    // subscribe to user project image (updates thumbnail on non-opened projects)
    editor.on('messenger:project.user.image', (data) => {
        config.project.thumbnails = data.project.thumbnails;
        projectImg.style.backgroundImage = `url("${data.project.thumbnails && data.project.thumbnails.m}")`;
        projectImg.classList.remove('progress');
    });
});
