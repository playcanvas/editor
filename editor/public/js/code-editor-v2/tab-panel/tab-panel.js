editor.once('load', function () {
    'use strict';

    var panel = editor.call('layout.tabs');

    // holds tabs
    var tabsIndex = {};

    // tab order
    var tabOrder = [];

    var focusedTab = null;

    var grabbedTab = null;

    // mouse x when we grabbed a tab
    var grabbedMouseX = 0;
    // tab x when we grabbed it
    var grabbedX = 0;

    // tab positions when we grabbed a tab
    var tabPositions = [];

    // unhide tabs panel when asset
    // is selected and create tab for asset
    // or focus existing tab
    editor.on('select:asset', function (asset) {
        if (asset.get('type') === 'folder')
            return;

        panel.hidden = false;

        var id = asset.get('id')

        if (! tabsIndex[id]) {
            // create tab
            var tab = new ui.Panel();
            tab.class.add('tab');

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

            // append tab
            panel.append(tab);

            // add index entry
            var entry = {
                tab: tab,
                asset: asset,
                name: name,
                progress: progress
            };

            tabsIndex[id] = entry;

            tabOrder.push(tabsIndex[id]);

            btnClose.on('click', function (e) {
                e.stopPropagation();
                editor.emit('documents:close', id);
            });

            // grab tab
            tab.element.addEventListener('mousedown', function (e) {
                editor.call('files:select', id);
                grabTab(entry, e);
            });

        }

        focusTab(id);
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

            if (order > 0) {
                editor.emit('select:asset', tabOrder[order -1 ].asset);
            } else if (order < tabOrder.length - 1) {
                editor.emit('select:asset', tabOrder[order + 1].asset);
            } else {
                panel.hidden = true;
            }
        }

        // remove tab
        delete tabsIndex[id];
        tabOrder.splice(order, 1);
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

        // if (focusedTab === entry) {
        //     document.title = text + ' | ' + config.project.id + ' | ' + ' Code Editor';
        // }
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
        }

        grabbedTab = null;
        tabPositions.length = 0;
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

                // move tab to the right
                el.style.left = tabPositions[i] + grabbedTab.tab.element.offsetWidth + 'px';

                // swap DOM
                panel.appendBefore(grabbedTab.tab, tabOrder[i].tab);

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

                    // move tab to the left
                    el.style.left = tabPositions[i] - grabbedTab.tab.element.offsetWidth + 'px';

                    // swap DOM
                    panel.appendAfter(grabbedTab.tab, tabOrder[i].tab);

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
    editor.call('tabs:list', function () {
        return tabOrder.slice();
    });

    // handle asset name changes
    editor.on('assets:add', function (asset) {
        asset.on('name:set', function (name) {
            var entry = tabsIndex[asset.get('id')];
            if (entry)
                entry.name.text = name;
        });
    });

});