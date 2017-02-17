editor.once('load', function () {
    'use strict';

    var panel = editor.call('layout.tabs');

    // holds tabs
    var tabsIndex = {};

    // tab order
    var tabOrder = [];

    // The focused tab
    var focusedTab = null;
    // The tab that new files will use
    // to open in
    var temporaryTab = null;
    // The tab that the user is currently dragging
    var grabbedTab = null;

    // mouse x when we grabbed a tab
    var grabbedMouseX = 0;
    // tab x when we grabbed it
    var grabbedX = 0;

    // tab positions when we grabbed a tab
    var tabPositions = [];

    // if true then when we close a tab
    // we won't automatically select a different tab
    var batchClose = false;

    // If true then the temporary tab will
    // not switch to a different file
    var lockTemporary = false;


    // unhide tabs panel when asset
    // is selected and create tab for asset
    // or focus existing tab
    editor.on('select:asset', function (asset) {
        if (asset.get('type') === 'folder')
            return;

        panel.hidden = false;

        var id = asset.get('id')

        var isNew = !tabsIndex[id];

        if (isNew) {

            // if we have a global error skip opening a new tab
            if (editor.call('errors:hasRealtime'))
                return;

            // create tab
            var tab = new ui.Panel();
            tab.class.add('tab');
            tab._assetId = id;

            // name container
            var panelName = new ui.Panel();
            panelName.class.add('name');

            tab.append(panelName);

            // tab name
            var name = new ui.Label({
                text: asset.get('name')
            });
            name.class.add('name');

            panelName.append(name);

            // close button
            var btnClose = new ui.Button({
                text: '&#57650;'
            });
            btnClose.class.add('close');

            tab.append(btnClose);

            // loading progress
            var progress = new ui.Progress();
            progress.progress = 100;
            tab.append(progress);

            // add index entry
            var entry = {
                tab: tab,
                asset: asset,
                name: name,
                progress: progress
            };

            tabsIndex[id] = entry;

            // add the tab next to the focused tab
            var focused = -1;
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

            // close tab button
            btnClose.on('click', function (e) {
                e.stopPropagation();
                editor.emit('documents:close', entry.asset.get('id'));
            });

            var onGrab = function (e) {
                if (e.target === btnClose.element)
                    return;

                // close on middle click
                if (e.button === 1) {
                    e.stopPropagation();
                    editor.emit('documents:close', entry.asset.get('id'));
                    return;
                }

                if (e.button === 0) {
                    editor.call('files:select', entry.asset.get('id'));
                    grabTab(entry, e);
                }
            }

            var onMouseEnter = function (e) {
                tab.class.add('hovered');
            };

            var onMouseLeave = function (e) {
                tab.class.remove('hovered');
            };

            // grab tab
            tab.element.addEventListener('mousedown', onGrab);

            // use hovered class for the close button
            // because the :hover selector doesn't seem to work
            // right all the time due to the fact that
            // each tab is removed-readded to the DOM when we move it
            tab.element.addEventListener('mouseenter', onMouseEnter);

            tab.element.addEventListener('mouseleave', onMouseLeave);

            tab.on('destroy', function () {
                tab.element.removeEventListener('mousedown', onGrab);
                tab.element.removeEventListener('mouseenter', onMouseEnter);
                tab.element.removeEventListener('mouseleave', onMouseLeave);
            });

            // context menu
            editor.call('tabs:contextmenu:attach', entry);

            // emit event
            editor.emit('tabs:open', entry);
        }

        focusTab(id);

        // If this is a new tab then make it temporary
        // and close old temporary
        if (isNew && ! lockTemporary) {
            if (temporaryTab)
                editor.emit('documents:close', temporaryTab.asset.get('id'));

            temporaryTab = tabsIndex[id];
            temporaryTab.tab.class.add('temporary');
        }
    });

    // focus a tab
    var focusTab = function (id) {
        var entry = tabsIndex[id];
        if (focusedTab === entry) {
            return;
        }

        if (focusedTab) {
            focusedTab.tab.class.remove('focused');
        }

        focusedTab = entry;

        focusedTab.tab.class.add('focused');

        updateTitle(id, editor.call('documents:isDirty', id));
    };

    // Closes a tab
    var closeTab = function (id) {
        var tab = tabsIndex[id];
        if (! tab) return;

        tab.tab.destroy();

        var order = tabOrder.indexOf(tab);

        // focus previous tab or next tab if
        // this was the first tab
        if (focusedTab === tab) {
            focusedTab = null;

            if (! batchClose) {
                if (order > 0) {
                    editor.call('files:select', tabOrder[order - 1].asset.get('id'));
                } else if (order < tabOrder.length - 1) {
                    editor.call('files:select', tabOrder[order + 1].asset.get('id'));
                } else {
                    panel.hidden = true;
                }
            }
        }

        if (temporaryTab === tab)
            temporaryTab = null;

        // remove tab
        delete tabsIndex[id];
        tabOrder.splice(order, 1);

        // emit event
        editor.emit('tabs:close', tab);
    };

    var updateTitle = function (id, dirty) {
        var entry = tabsIndex[id];
        if (entry) {
            if (dirty) {
                entry.tab.class.add('dirty');
            } else {
                entry.tab.class.remove('dirty');

            }
        }
    };

    var toggleProgress = function (id, toggle) {
        var tab = tabsIndex[id];
        if (tab)
            tab.progress.hidden = !toggle;
    };

    var grabTab = function (tab, e) {
        grabbedTab = tab;

        grabbedMouseX = e.clientX;
        grabbedX = grabbedTab.tab.element.offsetLeft;

        // turn all tabs to absolute positioning
        // but first get their coords before we start
        // changing them
        var widths = [];
        for (var i = 0; i < tabOrder.length; i++) {
            tabPositions.push(tabOrder[i].tab.element.offsetLeft);
            widths.push(tabOrder[i].tab.element.offsetWidth);
        }

        for (var i = 0; i < tabOrder.length; i++) {
            tabOrder[i].tab.element.style.position = 'absolute';
            tabOrder[i].tab.element.style.left = tabPositions[i] + 'px';
            tabOrder[i].tab.element.style.width = widths[i] + 'px';
            tabOrder[i].tab.element.style.top = '0';
        }

        // add animated class to other tabs
        // in order for them to be animated while moving around
        // Do it in a timeout because of a Safari bug
        setTimeout(function () {
            if (! grabbedTab)
                return;

            for (var i = 0; i < tabOrder.length; i++) {
                if (tabOrder[i] !== grabbedTab)
                    tabOrder[i].tab.class.add('animated');
            }
        });


        grabbedTab.tab.class.add('grabbed');

        window.addEventListener('mouseup', releaseTab);
        window.addEventListener('mousemove', moveTab);
    }

    var releaseTab = function () {
        window.removeEventListener('mouseup', releaseTab);
        window.removeEventListener('mousemove', moveTab);

        grabbedTab.tab.class.remove('grabbed');

        for (var i = 0; i < tabOrder.length; i++) {
            tabOrder[i].tab.style.position = '';
            tabOrder[i].tab.style.left = '';
            tabOrder[i].tab.style.top = '';
            tabOrder[i].tab.style.width = '';
            tabOrder[i].tab.class.remove('animated');
        }

        grabbedTab = null;
        tabPositions.length = 0;

        editor.emit('tabs:reorder', tabOrder);
    };

    var moveTab = function (e) {
        e.preventDefault();
        e.stopPropagation();

        var x = Math.max(0, grabbedX + e.clientX - grabbedMouseX);
        grabbedTab.tab.style.left = x + 'px';

        // search if we need to swap places with other tabs
        var index = tabOrder.indexOf(grabbedTab);

        var width = grabbedTab.tab.element.offsetWidth;

        var searchRight = true;

        // first search left
        for (var i = index - 1; i >= 0; i--) {
            var el = tabOrder[i].tab.element;
            if (tabPositions[i] + el.offsetWidth / 2 > x) {
                searchRight = false;

                // swap DOM
                panel.appendBefore(grabbedTab.tab, tabOrder[i].tab);

                // move tab to the right
                el.style.left = tabPositions[i] + grabbedTab.tab.element.offsetWidth + 'px';

                // swap
                tabOrder[index] = tabOrder[i];
                tabOrder[i] = grabbedTab;

                tabPositions[index] = tabPositions[i] + grabbedTab.tab.element.offsetWidth;

                index = i;


            } else {
                break;
            }
        }

        // then search right
        if (searchRight) {
            for (var i = index + 1, len = tabOrder.length; i < len; i++) {
                var el = tabOrder[i].tab.element;
                if (tabPositions[i] < x + width / 2) {

                    // swap DOM
                    panel.appendAfter(grabbedTab.tab, tabOrder[i].tab);

                    // move tab to the left
                    el.style.left = tabPositions[i] - grabbedTab.tab.element.offsetWidth + 'px';

                    // swap
                    tabOrder[index] = tabOrder[i];
                    tabOrder[i] = grabbedTab;

                    tabPositions[index] = tabPositions[i] - grabbedTab.tab.element.offsetWidth;

                    index = i;
                } else {
                    break;
                }

            }
        }
    };

    // hide progress when document is loaded
    editor.on('documents:load', function (doc, asset) {
        toggleProgress(doc.name, false);
    });


    // Make temporary tab stick and not be in preview mode anymore
    editor.method('tabs:temp:stick', function () {
        if (temporaryTab) {
            temporaryTab.tab.class.remove('temporary');
            temporaryTab = null;
        }
    });

    editor.method('tabs:temp:lock', function () {
        lockTemporary = true;
    });

    editor.method('tabs:temp:unlock', function () {
        lockTemporary = false;
    });

    // change title on dirty doc
    editor.on('documents:dirty', function (id, dirty) {
        updateTitle(id, dirty);

        // hide saving progress
        // no matter if the doc is dirty or not
        // If it's not dirty it means it was saved. If it is dirty
        // it means that either the user edited it while saving
        // or we reconnected to the server and found out that
        // our save operation did not complete since the document is still dirty
        toggleProgress(id, false);
    });

    // when the user edits a document locally then make the tab permanent
    editor.on('documents:dirtyLocal', function (id, dirty) {
        // if this is the temporary tab make it permanent
        if (dirty && temporaryTab && temporaryTab === tabsIndex[id]) {
            editor.call('tabs:temp:stick');
        }
    });

    // close tab
    editor.on('documents:close', closeTab);

    // show progress while saving
    editor.on('editor:command:save:start', function (id) {
        toggleProgress(id, true);
    });

    editor.on('editor:command:save:end', function (id) {
        toggleProgress(id, false);
    });

    // returns all tabs
    editor.method('tabs:list', function () {
        return tabOrder;
    });

    // returns focused tab
    editor.method('tabs:focused', function () {
        return focusedTab;
    });

    // returns true if the asset id is shown in the temporary tab
    editor.method('tabs:isTemp', function (id) {
        return temporaryTab && temporaryTab === tabsIndex[id];
    });

    // starts batch closing tabs
    editor.method('tabs:batchClose:start', function () {
        batchClose = true;
    });

    // ends batch closing tabs
    editor.method('tabs:batchClose:end', function () {
        batchClose = false;
    });

    // handle asset name changes
    editor.on('assets:add', function (asset) {
        asset.on('name:set', function (name) {
            var entry = tabsIndex[asset.get('id')];
            if (entry)
                entry.name.text = name;
        });
    });

    // Mark errored tab
    editor.on('documents:error', function (id) {
        var entry = tabsIndex[id];
        if (entry)
            entry.tab.class.add('error');
    });


});