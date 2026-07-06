import type { EventHandle } from '@playcanvas/observer';
import type { Element } from '@playcanvas/pcui';
import { Button, Container, Label, Menu, TextInput } from '@playcanvas/pcui';

import { convertDatetime } from '@/common/utils';
import { config } from '@/editor/config';

type Scene = {
    id: number | string;
    name: string;
    modified: string;
    uniqueId: string;
};

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

    // disables / enables field depending on permissions
    const handlePermissions = (field: Element) => {
        field.enabled = editor.call('permissions:write');
        return editor.on(`permissions:set:${config.self.id}`, (accessLevel) => {
            field.enabled = accessLevel === 'write' || accessLevel === 'admin';
        });
    };

    const toolbar = new Container({
        class: 'toolbar'
    });
    container.append(toolbar);

    const filter = new TextInput({
        placeholder: 'Search',
        keyChange: true,
        renderChanges: false,
        class: 'filter'
    });
    filter.on('change', () => {
        refreshScenes();
    });
    toolbar.append(filter);

    const newScene = new Button({
        text: 'New Scene',
        icon: 'E120',
        class: 'new'
    });
    handlePermissions(newScene);
    toolbar.append(newScene);

    // skeleton placeholder shown only while the first scene list loads
    const skeleton = new Container({
        class: 'scenes-skeleton'
    });
    for (let i = 0; i < 4; i++) {
        const skeletonRow = document.createElement('div');
        skeletonRow.classList.add('skeleton-row');
        const title = document.createElement('div');
        title.classList.add('bone', 'title');
        const sub = document.createElement('div');
        sub.classList.add('bone', 'sub');
        skeletonRow.appendChild(title);
        skeletonRow.appendChild(sub);
        skeleton.dom.appendChild(skeletonRow);
    }
    skeleton.hidden = true;
    container.append(skeleton);

    const sceneList = new Container({
        dom: 'ul',
        class: ['ui-list', 'scene-list']
    });
    container.append(sceneList);
    sceneList.hidden = true;

    // empty-state shown when the search filter matches no scenes
    const noScenes = new Container({
        class: 'no-filtered-scenes',
        hidden: true
    });
    const noScenesText = new Label();
    noScenes.append(noScenesText);
    const clearSearch = document.createElement('button');
    clearSearch.type = 'button';
    clearSearch.classList.add('clear-search');
    clearSearch.textContent = 'Clear search';
    clearSearch.addEventListener('click', () => {
        filter.value = '';
        refreshScenes();
    });
    noScenes.dom.appendChild(clearSearch);
    container.append(noScenes);

    let events: EventHandle[] = [];
    let scenes: Scene[] = [];
    let loaded = false;

    let dropdownScene: Scene | null = null;
    let dropdownMenu: Menu | null = null;

    const toggleLoading = (toggle: boolean) => {
        skeleton.hidden = !toggle;
        if (toggle) {
            sceneList.hidden = true;
            noScenes.hidden = true;
        }
    };

    const onSceneDeleted = (sceneId: number | string) => {
        // if loaded scene deleted do not allow closing popup
        if (!config.scene.id || parseInt(String(config.scene.id), 10) === parseInt(String(sceneId), 10)) {
            editor.call('picker:project:setClosable', false);
        }

        // update the cache even while hidden so the next open stays fresh
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

        // re-render in place when the panel is open
        if (!container.hidden) {
            refreshScenes();
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

    // relative time for recent edits (just now / minutes / hours / days ago),
    // absolute date otherwise — mirrors the builds & publish window
    const formatSceneDate = (value: string) => {
        const d = new Date(value);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfThatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const days = Math.round((startOfToday - startOfThatDay) / 86400000);

        if (days <= 0) {
            const mins = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 60000));
            if (mins < 1) {
                return 'just now';
            }
            if (mins < 60) {
                return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
            }
            const hours = Math.floor(mins / 60);
            return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        }
        if (days === 1) {
            return 'yesterday';
        }
        if (days < 7) {
            return `${days} days ago`;
        }
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // create row for scene
    const createSceneEntry = (scene: Scene) => {
        const row = new Container({
            dom: 'li',
            id: `picker-scene-${scene.id}`
        });

        sceneList.append(row);

        const isCurrentScene =
            config.scene.id && parseInt(String(scene.id), 10) === parseInt(String(config.scene.id), 10);

        if (isCurrentScene) {
            row.class.add('current');
        }

        // scene name
        const name = new Label({
            text: scene.name,
            class: isCurrentScene ? ['name', 'selectable'] : 'name'
        });

        row.append(name);

        // current-scene badge, sits inline next to the name
        if (isCurrentScene) {
            const current = new Label({
                text: 'CURRENT',
                class: 'current-badge'
            });
            row.append(current);
        }

        // scene date — relative time, full timestamp on hover
        const date = new Label({
            text: formatSceneDate(scene.modified),
            class: 'date'
        });
        date.dom.title = convertDatetime(scene.modified);
        row.append(date);

        // dropdown
        const dropdown = new Button({
            text: '\uE159',
            class: 'dropdown'
        });
        row.append(dropdown);

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
            events.push(
                row.on('click', (e) => {
                    if (e.target === row.dom || e.target === name.dom || e.target === date.dom) {
                        if (parseInt(String(config.scene.id), 10) === parseInt(String(scene.id), 10)) {
                            return;
                        }

                        editor.call('picker:scene:close');
                        editor.call('scene:load', scene.uniqueId);
                    }
                })
            );
        }

        row.on('click', (event) => {
            // on middle click, open the scene in a new tab
            if (event.button === 1) {
                let url = `/editor/scene/${dropdownScene.id}`;
                const params = new URLSearchParams(location.search);
                if (params.has('use_local_frontend')) {
                    url += `?use_local_frontend=${params.get('use_local_frontend')}`;
                }
                window.open(url, '_blank');
            }
        });

        return row;
    };

    const refreshScenes = () => {
        if (dropdownMenu) {
            dropdownMenu.hidden = true;
        }
        destroyEvents();
        sceneList.clear();
        const filterScenes = scenes.filter((scene) => {
            return scene.name.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1;
        });
        sortScenes(filterScenes);

        const empty = filterScenes.length === 0;
        sceneList.hidden = empty;
        noScenes.hidden = !empty;
        if (empty) {
            const searching = filter.value.length > 0;
            noScenesText.text = searching ? 'No scenes match your search.' : 'No scenes.';
            clearSearch.style.display = searching ? '' : 'none';
        }

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
                        for (const s of scenes) {
                            if (s.name === name) {
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
                class: 'delete',
                onIsEnabled: () => editor.call('permissions:write'),
                onSelect: () => {
                    editor.call(
                        'picker:confirm',
                        `Are you sure you want to permanently delete scene '${dropdownScene.name}'?`
                    );
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
                    let url = `/editor/scene/${dropdownScene.id}`;
                    const params = new URLSearchParams(location.search);
                    if (params.has('use_local_frontend')) {
                        url += `?use_local_frontend=${params.get('use_local_frontend')}`;
                    }
                    window.open(url, '_blank');
                }
            }
        ]
    });

    editor.call('layout.root').append(dropdownMenu);

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

    newScene.on('click', () => {
        if (!editor.call('permissions:write')) {
            return;
        }

        newScene.enabled = false;

        // add list item
        const listItem = new Container({
            dom: 'li',
            class: 'new-scene'
        });
        sceneList.append(listItem);
        sceneList.hidden = false;

        // add label
        const label = new Label({
            text: 'Enter Scene name and press Enter:',
            class: 'new-scene-label'
        });
        listItem.append(label);

        // add new scene input field
        const input = new TextInput({
            value: 'Untitled',
            placeholder: 'Enter Scene name and press Enter',
            blurOnEnter: false
        });

        listItem.append(input);

        input.focus(true);

        input.once('blur', () => {
            listItem.destroy();
            newScene.enabled = true;
        });

        input.on('keydown', (e: KeyboardEvent) => {
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
        if (loaded) {
            // render cached scenes immediately; messenger keeps them fresh
            toggleLoading(false);
            refreshScenes();
        } else {
            toggleLoading(true);
            editor.call('scenes:list', (items) => {
                scenes = items;
                loaded = true;
                toggleLoading(false);
                refreshScenes();
            });
        }

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // on hide
    container.on('hide', () => {
        destroyEvents();

        // clear the rendered rows (their ids may be reused by download /
        // new build popups) but keep the cached scenes for the next open
        sceneList.clear();

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
        // only maintain the cache once populated; an unopened panel fetches
        // the full list on its first show
        if (!loaded || data.scene.branchId !== config.self.branch.id) {
            return;
        }

        editor.call('scenes:get', data.scene.id, (err, scene) => {
            // keep the cache fresh even while hidden; avoid duplicates
            if (!scenes.some((s) => parseInt(String(s.id), 10) === parseInt(String(scene.id), 10))) {
                scenes.push(scene);
            }

            if (!container.hidden) {
                refreshScenes();
            }
        });
    });
});
