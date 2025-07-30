import { Button, Container, Label, Progress } from '@playcanvas/pcui';

editor.once('load', () => {
    /** @type {Container} */
    const panel = editor.call('layout.tabs');

    // holds tabs
    const tabsIndex = {};

    // tab order
    const tabOrder = [];

    // The focused tab
    let focusedTab = null;
    // The tab that new files will use
    // to open in
    let temporaryTab = null;

    // The tab that the user is currently dragging
    let grabbedTab = null;

    // mouse x when we grabbed a tab
    let grabbedMouseX = 0;
    // tab x when we grabbed it
    let grabbedX = 0;

    // tab positions when we grabbed a tab
    const tabPositions = [];

    // if true then when we close a tab
    // we won't automatically select a different tab
    let batchClose = false;

    // If true then the temporary tab will
    // not switch to a different file
    let lockTemporary = false;

    // pseudo-id of find in files tab
    const FIND_IN_FILES = 'Find in Files';

    const updateDirty = function (id, dirty) {
        const entry = tabsIndex[id];
        if (entry) {
            if (dirty) {
                entry.tab.class.add('dirty');
            } else {
                entry.tab.class.remove('dirty');

            }
        }
    };

    // focus a tab
    const focusTab = function (id) {
        const entry = tabsIndex[id];
        if (focusedTab === entry) {
            return;
        }

        panel.class.remove('invisible');

        if (focusedTab) {
            focusedTab.tab.class.remove('focused');
        }

        focusedTab = entry;

        focusedTab.tab.class.add('focused');

        if (entry.asset) {
            updateDirty(id, editor.call('documents:isDirty', id));
        } else {
            // unfocus any documents
            editor.emit('documents:unfocus');
        }

        editor.emit('tabs:focus', focusedTab);
    };

    // Closes a tab
    const closeTab = function (id) {
        const tab = tabsIndex[id];
        if (!tab) return;

        tab.tab.destroy();

        const order = tabOrder.indexOf(tab);

        if (temporaryTab === tab) {
            temporaryTab = null;
        }

        // remove tab
        delete tabsIndex[id];
        tabOrder.splice(order, 1);

        // emit event
        editor.emit('tabs:close', tab);

        // focus previous tab or next tab if
        // this was the first tab
        if (focusedTab === tab) {
            focusedTab = null;

            if (!batchClose) {
                const next = tabOrder[order - 1] || tabOrder[order];

                if (next) {
                    if (next.asset) {
                        editor.call('files:select', next.id);
                    } else {
                        focusTab(next.id);
                    }
                } else {
                    panel.class.add('invisible');
                }
            }
        }
    };

    const moveTab = function (e) {
        e.preventDefault();
        e.stopPropagation();

        const x = Math.max(0, grabbedX + e.clientX - grabbedMouseX);
        grabbedTab.tab.style.left = `${x}px`;

        // search if we need to swap places with other tabs
        let index = tabOrder.indexOf(grabbedTab);

        const width = grabbedTab.tab.dom.offsetWidth;

        let searchRight = true;

        // first search left
        for (let i = index - 1; i >= 0; i--) {
            const el = tabOrder[i].tab.dom;
            if (tabPositions[i] + el.offsetWidth / 2 > x) {
                searchRight = false;

                // swap DOM
                panel.appendBefore(grabbedTab.tab, tabOrder[i].tab);

                // move tab to the right
                el.style.left = `${tabPositions[i] + grabbedTab.tab.dom.offsetWidth}px`;

                // swap
                tabOrder[index] = tabOrder[i];
                tabOrder[i] = grabbedTab;

                tabPositions[index] = tabPositions[i] + grabbedTab.tab.dom.offsetWidth;

                index = i;
            } else {
                break;
            }
        }

        // then search right
        if (searchRight) {
            for (let i = index + 1, len = tabOrder.length; i < len; i++) {
                const el = tabOrder[i].tab.dom;
                if (tabPositions[i] < x + width / 2) {

                    // swap DOM
                    panel.appendAfter(grabbedTab.tab, tabOrder[i].tab);

                    // move tab to the left
                    el.style.left = `${tabPositions[i] - grabbedTab.tab.dom.offsetWidth}px`;

                    // swap
                    tabOrder[index] = tabOrder[i];
                    tabOrder[i] = grabbedTab;

                    tabPositions[index] = tabPositions[i] - grabbedTab.tab.dom.offsetWidth;

                    index = i;
                } else {
                    break;
                }
            }
        }
    };

    const releaseTab = function () {
        window.removeEventListener('mouseup', releaseTab);
        window.removeEventListener('mousemove', moveTab);

        grabbedTab.tab.class.remove('grabbed');

        for (let i = 0; i < tabOrder.length; i++) {
            tabOrder[i].tab.style.position = '';
            tabOrder[i].tab.style.left = '';
            tabOrder[i].tab.style.top = '';
            tabOrder[i].tab.style.width = '';
            tabOrder[i].tab.class.remove('animated');
        }

        editor.emit('tabs:reorder', grabbedTab, tabOrder);

        grabbedTab = null;
        tabPositions.length = 0;
    };

    const grabTab = function (tab, e) {
        grabbedTab = tab;

        grabbedMouseX = e.clientX;
        grabbedX = grabbedTab.tab.dom.offsetLeft;

        // turn all tabs to absolute positioning
        // but first get their coords before we start
        // changing them
        const widths = [];
        for (let i = 0; i < tabOrder.length; i++) {
            tabPositions.push(tabOrder[i].tab.dom.offsetLeft);
            widths.push(tabOrder[i].tab.dom.offsetWidth);
        }

        for (let i = 0; i < tabOrder.length; i++) {
            tabOrder[i].tab.dom.style.position = 'absolute';
            tabOrder[i].tab.dom.style.left = `${tabPositions[i]}px`;
            tabOrder[i].tab.dom.style.width = `${widths[i]}px`;
            tabOrder[i].tab.dom.style.top = '0';
        }

        // add animated class to other tabs
        // in order for them to be animated while moving around
        // Do it in a timeout because of a Safari bug
        setTimeout(() => {
            if (!grabbedTab) {
                return;
            }

            for (let i = 0; i < tabOrder.length; i++) {
                if (tabOrder[i] !== grabbedTab) {
                    tabOrder[i].tab.class.add('animated');
                }
            }
        });


        grabbedTab.tab.class.add('grabbed');

        window.addEventListener('mouseup', releaseTab);
        window.addEventListener('mousemove', moveTab);
    };

    // creates a tab
    const createTab = function (id, asset) {
        const tabName = asset ? asset.get('name') : id;

        const tab = new Container({
            class: 'tab'
        });

        if (asset) {
            tab._assetId = id;
        }

        // name container
        const panelName = new Container({
            class: 'name'
        });
        tab.append(panelName);

        // tab name
        const name = new Label({
            class: 'name',
            text: tabName
        });
        panelName.append(name);

        // close button
        const btnClose = new Button({
            class: 'close',
            icon: 'E132'
        });
        tab.append(btnClose);

        // loading progress
        let progress;
        if (asset) {
            progress = new Progress();
            progress.value = 100;
            tab.append(progress);
        }

        // add index entry
        const entry = {
            id: id,
            tab: tab,
            name: name
        };

        if (asset) {
            entry.asset = asset;
            entry.progress = progress;
        }

        tabsIndex[id] = entry;

        // add the tab next to the focused tab
        let focused = -1;
        if (focusedTab) {
            focused = tabOrder.indexOf(focusedTab);
        }

        if (focused >= 0) {
            tabOrder.splice(focused + 1, 0, entry);
            panel.appendAfter(tab, focusedTab.tab);
        } else {
            tabOrder.push(entry);
            panel.append(tab);
        }

        const close = function () {
            if (asset) {
                editor.emit('documents:close', id);
            } else {
                closeTab(id);
            }
        };

        // close tab button
        btnClose.on('click', (e) => {
            e.stopPropagation();
            close();
        });

        const onGrab = function (e) {
            if (e.target === btnClose.dom) {
                return;
            }

            // close on middle click
            if (e.button === 1) {
                e.stopPropagation();
                close();
                return;
            }

            if (e.button === 0) {
                if (asset) {
                    editor.call('files:select', entry.asset.get('id'));
                } else {
                    focusTab(id);
                }

                grabTab(entry, e);
            }
        };

        const onMouseEnter = function (e) {
            tab.class.add('hovered');
        };

        const onMouseLeave = function (e) {
            tab.class.remove('hovered');
        };

        // grab tab
        tab.dom.addEventListener('mousedown', onGrab);

        // use hovered class for the close button
        // because the :hover selector doesn't seem to work
        // right all the time due to the fact that
        // each tab is removed-readded to the DOM when we move it
        tab.dom.addEventListener('mouseenter', onMouseEnter);

        tab.dom.addEventListener('mouseleave', onMouseLeave);

        tab.on('destroy', (dom) => {
            dom.removeEventListener('mousedown', onGrab);
            dom.removeEventListener('mouseenter', onMouseEnter);
            dom.removeEventListener('mouseleave', onMouseLeave);
        });

        // context menu
        editor.call('tabs:contextmenu:attach', entry);

        // emit event
        editor.emit('tabs:open', entry);
    };

    const toggleProgress = function (id, toggle) {
        const tab = tabsIndex[id];
        if (tab && tab.progress) {
            tab.progress.hidden = !toggle;
        }
    };

    // unhide tabs panel when asset
    // is selected and create tab for asset
    // or focus existing tab
    editor.on('select:asset', (asset) => {
        if (asset.get('type') === 'folder') {
            return;
        }

        const id = asset.get('id');

        const isNew = !tabsIndex[id];

        if (isNew) {

            // if we have a global error skip opening a new tab
            if (editor.call('errors:hasRealtime')) {
                return;
            }

            createTab(id, asset);
        }

        focusTab(id);

        // If this is a new tab then make it temporary
        // and close old temporary
        if (isNew && !lockTemporary) {
            if (temporaryTab) {
                editor.emit('documents:close', temporaryTab.id);
            }

            temporaryTab = tabsIndex[id];
            temporaryTab.tab.class.add('temporary');
        }
    });

    // hide progress when document is loaded
    editor.on('documents:load', (doc, asset, docEntry) => {
        toggleProgress(asset.get('id'), false);
    });


    // Make temporary tab stick and not be in preview mode anymore
    editor.method('tabs:temp:stick', () => {
        if (temporaryTab) {
            temporaryTab.tab.class.remove('temporary');
            temporaryTab = null;
        }
    });

    editor.method('tabs:temp:lock', () => {
        lockTemporary = true;
    });

    editor.method('tabs:temp:unlock', () => {
        lockTemporary = false;
    });

    // change title on dirty doc
    editor.on('documents:dirty', (id, dirty) => {
        updateDirty(id, dirty);

        // hide saving progress
        // no matter if the doc is dirty or not
        // If it's not dirty it means it was saved. If it is dirty
        // it means that either the user edited it while saving
        // or we reconnected to the server and found out that
        // our save operation did not complete since the document is still dirty
        toggleProgress(id, false);
    });

    // when the user edits a document locally then make the tab permanent
    editor.on('documents:dirtyLocal', (id, dirty) => {
        // if this is the temporary tab make it permanent
        if (dirty && temporaryTab && temporaryTab === tabsIndex[id]) {
            editor.call('tabs:temp:stick');
        }
    });

    // close tab
    editor.on('documents:close', closeTab);

    // show progress while saving
    editor.on('editor:command:save:start', (id) => {
        toggleProgress(id, true);
    });

    editor.on('documents:save:success', (uniqueId) => {
        const asset = editor.call('assets:getUnique', uniqueId);
        if (asset) {
            toggleProgress(asset.get('id'), false);
        }
    });

    editor.on('documents:save:error', (uniqueId) => {
        const asset = editor.call('assets:getUnique', uniqueId);
        if (asset) {
            toggleProgress(asset.get('id'), false);
        }
    });

    // returns all tabs
    editor.method('tabs:list', () => {
        return tabOrder;
    });

    // returns focused tab
    editor.method('tabs:focused', () => {
        return focusedTab;
    });

    // returns true if the asset id is shown in the temporary tab
    editor.method('tabs:isTemp', (id) => {
        return temporaryTab && temporaryTab === tabsIndex[id];
    });

    // starts batch closing tabs
    editor.method('tabs:batchClose:start', () => {
        batchClose = true;
    });

    // ends batch closing tabs
    editor.method('tabs:batchClose:end', () => {
        batchClose = false;
    });

    // create find in files tab or open existing
    editor.method('tabs:findInFiles', () => {
        if (tabsIndex[FIND_IN_FILES]) {
            focusTab(FIND_IN_FILES);
        } else {
            createTab(FIND_IN_FILES);
            focusTab(FIND_IN_FILES);
        }

        return tabsIndex[FIND_IN_FILES];
    });

    editor.method('tabs:findInFiles:focus', () => {
        if (tabsIndex[FIND_IN_FILES]) {
            focusTab(FIND_IN_FILES);
        }
    });

    // close tab
    editor.method('tabs:close', (id) => {
        const entry = tabsIndex[id];
        if (!entry) return;

        if (entry.asset) {
            editor.emit('documents:close', id);
        } else {
            closeTab(id);
        }
    });

    // handle asset name changes
    editor.on('assets:add', (asset) => {
        asset.on('name:set', (name) => {
            const entry = tabsIndex[asset.get('id')];
            if (entry) {
                entry.name.text = name;
            }
        });
    });

    // Mark errored tab
    editor.on('documents:error', (id) => {
        const entry = tabsIndex[id];
        if (entry) {
            entry.tab.class.add('error');
        }
    });
});
