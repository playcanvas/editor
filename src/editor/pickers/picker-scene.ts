import type { EventHandle } from '@playcanvas/observer';
import { Button, Container, Element, Label, Menu, Progress, TextInput } from '@playcanvas/pcui';

import { LegacyList } from '@/common/ui/list';
import { LegacyListItem } from '@/common/ui/list-item';
import { convertDatetime } from '@/common/utils';

interface Scene {
    id: number | string;
    name: string;
    modified: string;
    uniqueId: string;
}

editor.once('load', () => {
    const container = new Container({
        class: 'picker-scene-panel'
    });

    editor.call('picker:project:registerMenu', 'scenes', 'Scenes', container);

    // scene should be the default
    editor.call('picker:project:setDefaultMenu', 'scenes');

    if (!editor.call('permissions:write')) {
        container.class.add('disabled');
    }

    // progress bar and loading label
    const loading = new Label({
        text: 'Loading...'
    });
    container.append(loading);

    const progressBar = new Progress({
        value: 100
    });
    progressBar.hidden = true;
    container.append(progressBar);

    const filter = new TextInput({
        placeholder: 'Filter scenes',
        keyChange: true,
        renderChanges: false,
        class: 'filter'
    });
    filter.on('change', () => {
        refreshScenes();
    });
    container.append(filter);

    const sceneList = new LegacyList();
    sceneList.class.add('scene-list');
    container.append(sceneList);
    sceneList.hidden = true;

    let events: EventHandle[] = [];
    let scenes: Scene[] = [];

    let dropdownScene: Scene | null = null;
    let dropdownMenu: Menu | null = null;

    const toggleProgress = (toggle: boolean) => {
        loading.hidden = !toggle;
        progressBar.hidden = !toggle;
        sceneList.hidden = toggle || !scenes.length;
    };

    const onSceneDeleted = (sceneId: number | string) => {
        // if loaded scene deleted do not allow closing popup
        if (!config.scene.id || parseInt(String(config.scene.id), 10) === parseInt(String(sceneId), 10)) {
            editor.call('picker:project:setClosable', false);
        }

        if (container.hidden) {
            return;
        }

        const row = document.getElementById(`picker-scene-${sceneId}`);
        if (row) {
            row.parentElement.removeChild(row);
        }

        for (let i = 0; i < scenes.length; i++) {
            if (parseInt(String(scenes[i].id), 10) === parseInt(String(sceneId), 10)) {
                // close dropdown menu if current scene deleted
                if (dropdownScene === scenes[i] && dropdownMenu) {
                    dropdownMenu.hidden = true;
                }

                scenes.splice(i, 1);
                break;
            }
        }

        if (!scenes.length) {
            sceneList.hidden = true;
        }
    };

    const destroyEvents = () => {
        events.forEach((evt) => {
            evt.unbind();
        });
        events = [];
    };

    // sort by case insensitive alphabetical order
    const sortScenes = (scenes: Scene[]) => {
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
    const createSceneEntry = (scene: Scene) => {
        const row = new LegacyListItem();
        row.element.id = `picker-scene-${scene.id}`;

        sceneList.append(row);

        const isCurrentScene = config.scene.id && parseInt(String(scene.id), 10) === parseInt(String(config.scene.id), 10);

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
                    if (parseInt(String(config.scene.id), 10) === parseInt(String(scene.id), 10)) {
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

    const refreshScenes = () => {
        if (dropdownMenu) {
            dropdownMenu.hidden = true;
        }
        destroyEvents();
        sceneList.element.innerHTML = '';
        const filterScenes = scenes.filter((scene) => {
            return scene.name.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1;
        });
        sortScenes(filterScenes);
        sceneList.hidden = filterScenes.length === 0;
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
                    let name;
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
    const handlePermissions = (field: Element) => {
        field.enabled = editor.call('permissions:write');
        return editor.on(`permissions:set:${config.self.id}`, (accessLevel) => {
            field.enabled = accessLevel === 'write' || accessLevel === 'admin';
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

    container.append(newScene);

    newScene.on('click', () => {
        if (!editor.call('permissions:write')) {
            return;
        }

        newScene.enabled = false;

        // add list item
        const listItem = new LegacyListItem();
        sceneList.append(listItem);
        sceneList.hidden = false;

        // add label
        const label = new Label({
            text: 'Enter Scene name and press Enter:',
            class: 'new-scene-label'
        });
        listItem.element.appendChild(label.dom);

        // add new scene input field
        const input = new TextInput({
            value: 'Untitled',
            placeholder: 'Enter Scene name and press Enter',
            blurOnEnter: false
        });

        listItem.element.appendChild(input.dom);

        input.focus(true);

        input.once('blur', () => {
            listItem.destroy();
            newScene.enabled = true;
        });

        input.dom.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
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
    container.on('show', () => {
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
    container.on('hide', () => {
        destroyEvents();
        scenes = [];

        // destroy scene items because same row ids
        // might be used by download / new build popups
        sceneList.element.innerHTML = '';

        editor.emit('picker:scene:close');

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', (state) => {
        if (state && !container.hidden) {
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
        if (container.hidden) {
            return;
        }
        if (data.scene.branchId !== config.self.branch.id) {
            return;
        }

        editor.call('scenes:get', data.scene.id, (err, scene) => {
            if (container.hidden) {
                return;
            } // check if hidden when Ajax returns

            scenes.push(scene);

            refreshScenes();
        });
    });
});
