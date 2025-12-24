import { Button, Label, Menu, TextInput } from '@playcanvas/pcui';

import { LegacyLabel } from '@/common/ui/label';
import { LegacyList } from '@/common/ui/list';
import { LegacyListItem } from '@/common/ui/list-item';
import { LegacyPanel } from '@/common/ui/panel';
import { LegacyProgress } from '@/common/ui/progress';
import { LegacyTextField } from '@/common/ui/text-field';
import { convertDatetime } from '@/common/utils';

editor.once('load', () => {
    const panel = new LegacyPanel();
    panel.class.add('picker-scene-panel');

    editor.call('picker:project:registerMenu', 'scenes', 'Scenes', panel);

    // scene should be the default
    editor.call('picker:project:setDefaultMenu', 'scenes');

    if (!editor.call('permissions:write')) {
        panel.class.add('disabled');
    }

    // progress bar and loading label
    const loading = new LegacyLabel({
        text: 'Loading...'
    });
    panel.append(loading);

    const progressBar = new LegacyProgress({ progress: 1 });
    progressBar.hidden = true;
    panel.append(progressBar);

    const filter = new TextInput({
        placeholder: 'Filter scenes',
        keyChange: true,
        renderChanges: false,
        class: 'filter'
    });
    filter.on('change', () => {
        refreshScenes();
    });
    panel.append(filter);

    const container = new LegacyList();
    container.class.add('scene-list');
    panel.append(container);
    container.hidden = true;

    let tooltips = [];
    let events = [];
    let scenes = [];

    let dropdownScene = null;
    let dropdownMenu = null;

    const toggleProgress = function (toggle) {
        loading.hidden = !toggle;
        progressBar.hidden = !toggle;
        container.hidden = toggle || !scenes.length;
    };

    const onSceneDeleted = function (sceneId) {
        // if loaded scene deleted do not allow closing popup
        if (!config.scene.id || parseInt(config.scene.id, 10) === parseInt(sceneId, 10)) {
            editor.call('picker:project:setClosable', false);
        }

        if (panel.hidden) {
            return;
        }

        const row = document.getElementById(`picker-scene-${sceneId}`);
        if (row) {
            row.parentElement.removeChild(row);
        }

        for (let i = 0; i < scenes.length; i++) {
            if (parseInt(scenes[i].id, 10) === parseInt(sceneId, 10)) {
                // close dropdown menu if current scene deleted
                if (dropdownScene === scenes[i]) {
                    dropdownMenu.hidden = true;
                }

                scenes.splice(i, 1);
                break;
            }
        }

        if (!scenes.length) {
            container.hidden = true;
        }
    };

    const destroyTooltips = function () {
        tooltips.forEach((tooltip) => {
            tooltip.destroy();
        });
        tooltips = [];
    };

    const destroyEvents = function () {
        events.forEach((evt) => {
            evt.unbind();
        });
        events = [];
    };

    // sort by case insensitive alphabetical order
    const sortScenes = function (scenes) {
        scenes.sort((a, b) => {
            const aname = a.name.toLowerCase();
            const bname = b.name.toLowerCase();

            if (aname < bname) {
                return -1;
            }
            if (aname > bname) {
                return 1;
            }

            // then sort by item_id
            if (a.id < b.id) {
                return -1;
            }
            if (a.id > b.id) {
                return 1;
            }

            return 0;
        });
    };

    // create row for scene
    const createSceneEntry = function (scene) {
        const row = new LegacyListItem();
        row.element.id = `picker-scene-${scene.id}`;

        container.append(row);

        const isCurrentScene = config.scene.id && parseInt(scene.id, 10) === parseInt(config.scene.id, 10);

        if (isCurrentScene) {
            row.class.add('current');
        }

        // scene name
        const name = new Label({
            text: scene.name,
            class: isCurrentScene ? ['name', 'selectable'] : 'name'
        });

        row.element.appendChild(name.dom);

        // scene date
        const date = new Label({
            text: convertDatetime(scene.modified),
            class: 'date'
        });
        row.element.appendChild(date.dom);

        // dropdown
        const dropdown = new Button({
            text: '\uE159',
            class: 'dropdown'
        });
        row.element.appendChild(dropdown.dom);

        dropdown.on('click', () => {
            dropdown.class.add('clicked');
            dropdown.text = '\uE157';

            dropdownScene = scene;
            dropdownMenu.hidden = false;
            const rect = dropdown.dom.getBoundingClientRect();
            const menuItems = dropdownMenu.dom.querySelector('.pcui-menu-items') as HTMLElement;
            dropdownMenu.position(rect.right - menuItems.clientWidth, rect.bottom);
        });

        if (!isCurrentScene) {
            events.push(row.on('click', (e) => {
                if (e.target === row.element || e.target === name.dom || e.target === date.dom) {
                    if (parseInt(config.scene.id, 10) === parseInt(scene.id, 10)) {
                        return;
                    }

                    editor.call('picker:scene:close');
                    editor.call('scene:load', scene.uniqueId);
                }
            }));
        }

        row.on('click', (event) => {
            // on middle click, open the scene in a new tab
            if (event.button === 1) {
                window.open(`/editor/scene/${dropdownScene.id}`, '_blank');
            }
        });

        return row;
    };

    const refreshScenes = function () {
        dropdownMenu.hidden = true;
        destroyTooltips();
        destroyEvents();
        container.element.innerHTML = '';
        const filterScenes = scenes.filter((scene) => {
            return scene.name.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1;
        });
        sortScenes(filterScenes);
        container.hidden = filterScenes.length === 0;
        filterScenes.forEach(createSceneEntry);
    };

    // dropdown menu for each scene
    dropdownMenu = new Menu({
        class: 'picker-scene-menu',
        items: [
            {
                text: 'Duplicate Scene',
                onIsEnabled: () => editor.call('permissions:write'),
                onSelect: () => {
                    let name = dropdownScene.name;
                    const regex = /^(.*?) (\d+)$/;
                    let numberPart = 2;
                    let namePart = dropdownScene.name;
                    const matches = dropdownScene.name.match(regex);
                    if (matches && matches.length === 3) {
                        namePart = matches[1];
                        numberPart = parseInt(matches[2], 10);
                    }

                    // create duplicate scene name
                    while (true) {
                        name = `${namePart} ${numberPart}`;
                        let found = true;
                        for (let i = 0; i < scenes.length; i++) {
                            if (scenes[i].name === name) {
                                numberPart++;
                                found = false;
                                break;
                            }
                        }

                        if (found) {
                            break;
                        }
                    }

                    editor.call('scenes:duplicate', dropdownScene.id, name);
                }
            },
            {
                text: 'Delete Scene',
                onIsEnabled: () => editor.call('permissions:write'),
                onSelect: () => {
                    editor.call('picker:confirm', `Are you sure you want to permanently delete scene '${dropdownScene.name}'?`);
                    editor.once('picker:confirm:yes', () => {
                        const id = dropdownScene.id;
                        onSceneDeleted(id);
                        editor.call('scenes:delete', id);
                    });
                }
            },
            {
                text: 'Item History',
                onIsEnabled: () => editor.call('permissions:read'),
                onSelect: () => {
                    editor.call('vcgraph:utils', 'launchItemHist', 'scenes', dropdownScene.id);
                }
            },
            {
                text: 'Open in New Tab',
                onIsEnabled: () => editor.call('permissions:read'),
                onSelect: () => {
                    window.open(`/editor/scene/${dropdownScene.id}`, '_blank');
                }
            }
        ]
    });

    editor.call('layout.root').append(dropdownMenu);

    // disables / enables field depending on permissions
    const handlePermissions = function (field) {
        field.disabled = !editor.call('permissions:write');
        return editor.on(`permissions:set:${config.self.id}`, (accessLevel) => {
            if (accessLevel === 'write' || accessLevel === 'admin') {
                field.disabled = false;
            } else {
                field.disabled = true;
            }
        });
    };

    // on closing menu remove 'clicked' class from respective dropdown
    dropdownMenu.on('hide', () => {
        if (dropdownScene) {
            const item = document.getElementById(`picker-scene-${dropdownScene.id}`);
            if (item) {
                const clicked = item.querySelector('.clicked');
                if (clicked) {
                    clicked.classList.remove('clicked');
                    clicked.textContent = '\uE159';
                }
            }
        }
    });

    // new scene button
    const newScene = new Button({
        text: 'Add new Scene',
        class: 'new'
    });

    handlePermissions(newScene);

    panel.append(newScene);

    newScene.on('click', () => {
        if (!editor.call('permissions:write')) {
            return;
        }

        newScene.disabled = true;

        // add list item
        const listItem = new LegacyListItem();
        container.append(listItem);
        container.hidden = false;

        // add label
        const label = new LegacyLabel({
            text: 'Enter Scene name and press Enter:'
        });
        label.class.add('new-scene-label');
        listItem.element.appendChild(label.element);

        // add new scene input field
        const input = new LegacyTextField({
            default: 'Untitled',
            placeholder: 'Enter Scene name and press Enter'
        });

        input.blurOnEnter = false;

        listItem.element.appendChild(input.element);

        input.elementInput.focus();
        input.elementInput.select();

        const destroyField = function () {
            listItem.destroy();
            newScene.disabled = false;
        };

        input.elementInput.addEventListener('blur', destroyField);

        input.elementInput.addEventListener('keydown', (e) => {
            if (e.keyCode === 13) {
                if (!input.value) {
                    return;
                }

                editor.call('picker:scene:close');
                editor.call('scenes:new', input.value, (scene) => {
                    editor.call('scene:load', scene.uniqueId, true);
                });
            }
        });
    });

    // on show
    panel.on('show', () => {
        toggleProgress(true);

        // load scenes
        editor.call('scenes:list', (items) => {
            toggleProgress(false);
            scenes = items;
            refreshScenes();
        });

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // on hide
    panel.on('hide', () => {
        destroyTooltips();
        destroyEvents();
        scenes = [];

        // destroy scene items because same row ids
        // might be used by download / new build popups
        container.element.innerHTML = '';

        editor.emit('picker:scene:close');

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', (state) => {
        if (state && !panel.hidden) {
            setTimeout(() => {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // call picker
    editor.method('picker:scene', () => {
        editor.call('picker:project', 'scenes');
    });

    // close picker
    editor.method('picker:scene:close', () => {
        editor.call('picker:project:close');
    });

    // subscribe to messenger scene.delete
    editor.on('messenger:scene.delete', (data) => {
        if (data.scene.branchId !== config.self.branch.id) {
            return;
        }
        onSceneDeleted(data.scene.id);
    });

    // subscribe to messenger scene.new
    editor.on('messenger:scene.new', (data) => {
        if (panel.hidden) {
            return;
        }
        if (data.scene.branchId !== config.self.branch.id) {
            return;
        }

        editor.call('scenes:get', data.scene.id, (err, scene) => {
            if (panel.hidden) {
                return;
            } // check if hidden when Ajax returns

            scenes.push(scene);

            refreshScenes();
        });
    });
});
