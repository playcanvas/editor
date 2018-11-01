editor.once('load', function () {
    'use strict';

    // main panel
    var panel = new ui.Panel();
    panel.class.add('picker-builds');

    // holds events that need to be destroyed
    var events = [];

    var projectSettings = editor.call('settings:project');

    // disables / enables field depending on permissions
    var handlePermissions = function (field) {
        field.disabled = ! editor.call('permissions:write');
        return editor.on('permissions:set:' + config.self.id, function (accessLevel) {
            if (accessLevel === 'write' || accessLevel == 'admin') {
                field.disabled = false;
            } else {
                field.disabled = true;
            }
        });
    };

    // progress bar and loading label
    var loading = new ui.Label({
        text: 'Loading...'
    });
    panel.append(loading);

    var progressBar = new ui.Progress({progress: 1});
    progressBar.hidden = true;
    panel.append(progressBar);

    // no builds message
    var noBuilds = new ui.Label({
        text: 'You have not published any builds. Click PUBLISH to create a new build.'
    });
    noBuilds.hidden = true;
    noBuilds.style.padding = '15px';
    panel.append(noBuilds);

    // published build section
    var publishedBuild = new ui.Label({
        text: 'Your primary build is available at <a href="' + config.project.playUrl + '" target="_blank">' + config.project.playUrl + '</a>.',
        unsafe: true
    });
    publishedBuild.class.add('build');
    panel.append(publishedBuild);

    // container for builds
    var container = new ui.List();
    panel.append(container);

    // app whose dropdown was last clicked
    var dropdownApp = null;

    // all loaded builds
    var apps = [];

    // holds all tooltips
    var tooltips = [];

    var dropdownMenu = ui.Menu.fromData({
        'app-delete': {
            title: 'Delete',
            filter: function () {
                return editor.call('permissions:write');
            },
            select: function () {
                editor.call('picker:confirm', 'Are you sure you want to delete this Build?');
                editor.once('picker:confirm:yes', function () {
                    removeApp(dropdownApp);
                    editor.call('apps:delete', dropdownApp.id);
                });
            }
        }
    });

    // add menu
    editor.call('layout.root').append(dropdownMenu);

    // on closing menu remove 'clicked' class from respective dropdown
    dropdownMenu.on('open', function (open) {
        if (! open && dropdownApp) {
            var item = document.getElementById('app-' + dropdownApp.id);
            if (item) {
                var clicked = item.querySelector('.clicked');
                if (clicked) {
                    clicked.innerHTML = '&#57689;';
                    clicked.classList.remove('clicked');
                }
            }
        }
    });

    // register panel with project popup
    editor.call('picker:project:registerMenu', 'builds', 'Builds', panel);

    // open publishing popup
    editor.method('picker:builds', function () {
        editor.call('picker:project', 'builds');
    });

    var toggleProgress = function (toggle) {
        loading.hidden = !toggle;
        progressBar.hidden = !toggle;
        container.hidden = toggle || apps.length === 0;
        publishedBuild.hidden = toggle || !config.project.primaryApp;
        noBuilds.hidden = toggle || apps.length > 0;
    };

    // load app list
    var loadApps = function () {
        toggleProgress(true);

        editor.call('apps:list', function (results) {
            apps = results;
            toggleProgress(false);
            refreshApps();
        });
    };

    // recreate app list UI
    var refreshApps = function () {
        dropdownMenu.open = false;
        destroyTooltips();
        destroyEvents();
        container.element.innerHTML = '';
        sortApps(apps);
        container.hidden = apps.length === 0;
        apps.forEach(createAppItem);
    };

    var destroyTooltips = function () {
        tooltips.forEach(function (tooltip) {
            tooltip.destroy();
        });
        tooltips = [];
    };

    var destroyEvents = function () {
        events.forEach(function (evt) {
            evt.unbind();
        });
        events = [];
    };

    // sort apps by primary first and then created date
    var sortApps = function (apps) {
        return apps.sort(function (a, b) {
            if (config.project.primaryApp === a.id) {
                return -1;
            } else if (config.project.primaryApp === b.id) {
                return 1;
            } else {
                if (a.created_at < b.created_at) {
                    return 1;
                } else if (a.created_at > b.created_at) {
                    return -1;
                } else {
                    return 0;
                }
            }
        });
    };

    // create UI for single app
    var createAppItem = function (app) {
        var item = new ui.ListItem();
        item.element.id = 'app-' + app.id;

        container.append(item);

        if (config.project.primaryApp === app.id) {
            item.class.add('primary');
        }

        item.class.add(app.task.status);

        // primary app button
        var primary = new ui.Button({
            text: '&#57891'
        });
        events.push(handlePermissions(primary));
        if (! primary.disabled && app.task.status !== 'complete')
            primary.disabled = true;
        primary.class.add('primary');
        item.element.appendChild(primary.element);

        // set primary app
        events.push(primary.on('click', function () {
            if (config.project.primaryApp === app.id || app.task.status !== 'complete')
                return;

            editor.call('project:setPrimaryApp', app.id, null, function () {
                // error - refresh apps again to go back to previous state
                refreshApps();
            });

            // refresh apps instantly
            refreshApps();
        }));

        // primary icon tooltip
        var tooltipText = config.project.primaryApp === app.id ? 'Primary build' : 'Change the projects\'s primary build';
        var tooltip = Tooltip.attach({
            target: primary.element,
            text: tooltipText,
            align: 'right',
            root: editor.call('layout.root')
        });
        tooltips.push(tooltip);

        // status icon or image
        var status = document.createElement('span');
        status.classList.add('status');
        item.element.appendChild(status);

        var img;

        if (app.task.status === 'complete') {
            img = new Image();
            img.src = app.thumbnails ? app.thumbnails.s : (config.project.thumbnails.s || config.url.static + '/platform/images/common/blank_project.png');
            status.appendChild(img);
        } else if (app.task.status === 'running') {
            img = new Image();
            img.src = config.url.static + "/platform/images/common/ajax-loader.gif";
            status.appendChild(img);
        }

        var nameRow = document.createElement('div');
        nameRow.classList.add('name-row');
        item.element.appendChild(nameRow);

        // app name
        var name = new ui.Label({
            text: app.name
        });
        name.class.add('name');
        nameRow.appendChild(name.element);

        // app version
        var version = new ui.Label({
            text: app.version
        });
        version.class.add('version');
        nameRow.appendChild(version.element);

        // row below name
        var info = document.createElement('div');
        info.classList.add('info');
        item.element.appendChild(info);

        // date
        var date = new ui.Label({
            text: editor.call('datetime:convert', app.created_at)
        });
        date.class.add('date');
        date.hidden = app.task.status === 'error';
        info.appendChild(date.element);

        // views
        var views = new ui.Label({
            text: numberWithCommas(app.views)
        });
        views.class.add('views');
        views.hidden = app.task.status !== 'complete';
        info.appendChild(views.element);

        // size
        var size = new ui.Label({
            text: sizeToString(app.size)
        });
        size.hidden = app.task.status !== 'complete';
        size.class.add('size');
        info.appendChild(size.element);

        // branch
        if (editor.call('users:hasFlag', 'hasBranches')) {
            var branch = new ui.Label({
                text: app.branch && app.branch.name || 'master'
            });
            branch.hidden = app.task.status !== 'complete' || projectSettings.get('useLegacyScripts');
            branch.class.add('branch');
            info.appendChild(branch.element);
        }

        // error message
        var error = new ui.Label({
            text: app.task.message
        });
        error.hidden = app.task.status !== 'error';
        error.class.add('error');
        item.element.appendChild(error.element);

        // release notes
        var releaseNotes = app.release_notes || '';
        var indexOfNewLine = releaseNotes.indexOf('\n');
        if (indexOfNewLine !== -1) {
            releaseNotes = releaseNotes.substring(0, indexOfNewLine);
        }
        var notes = new ui.Label({
            text: app.release_notes
        });
        notes.renderChanges = false;
        notes.class.add('notes');
        notes.hidden = !error.hidden;
        item.element.appendChild(notes.element);

        // dropdown
        var dropdown = new ui.Button({
            text: '&#57689;'
        });
        dropdown.class.add('dropdown');
        item.element.appendChild(dropdown.element);

        events.push(dropdown.on('click', function () {
            dropdown.class.add('clicked');
            // change arrow
            dropdown.element.innerHTML = '&#57687;';
            dropdownApp = app;

            // open menu
            dropdownMenu.open = true;

            // position dropdown menu
            var rect = dropdown.element.getBoundingClientRect();
            dropdownMenu.position(rect.right - dropdownMenu.innerElement.clientWidth, rect.bottom);
        }));

        var more = new ui.Button({text: 'more...'});
        more.class.add('more');
        item.element.appendChild(more.element);
        more.hidden = true;

        events.push(more.on('click', function () {
            if (notes.class.contains('no-wrap')) {
                notes.text = app.release_notes;
                notes.class.remove('no-wrap');
                more.text = 'less...';
            } else {
                notes.class.add('no-wrap');
                more.text = 'more...';
                notes.text = releaseNotes;
            }
        }));

        if (notes.element.clientHeight > 22) {
            more.hidden = false;
            notes.class.add('no-wrap');
            notes.text = releaseNotes;
        }

        if (app.task.status === 'complete') {
            // handle row click
            var validTargets = [
                status,
                img,
                info,
                item.element,
                name.element,
                date.element,
                size.element,
                views.element,
                notes.element
            ];

            events.push(item.on('click', function (e) {
                if (validTargets.indexOf(e.target) !== -1) {
                    e.stopPropagation();
                    window.open(app.url);
                }
            }));
        }


        return item;
    };

    // Return the size fixed to 2 digits precision.
    // If the result does not have any decimal points then remove them
    var toFixed = function (size) {
        var result = size.toFixed(2);
        if (result % 1 === 0) {
            result = Math.floor(result);
        }

        return result;
    };

    // convert size in bytes to readable string
    var sizeToString = function (size) {
        var base = 1000;

        if (isNaN(size))
            size = 0;

        if (size < base)
            return size + ' Bytes';

        size /= base;

        if (size < base)
            return toFixed(size) + ' KB';

        size /= base;

        if (size < base)
            return toFixed(size) + ' MB';

        size /= base;

        if (size < base)
            return toFixed(size) + ' GB';

        size /= base;

        return toFixed(size) + ' TB';
    };

    // adds commas every 3 decimals
    var numberWithCommas = function (number) {
        var parts = number.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    // removes an app from the UI
    var removeApp = function (app) {
        var item = document.getElementById('app-' + app.id);
        if (item) {
            item.remove();
        }

        // remove from apps array
        for (var i = 0; i < apps.length; i++) {
            if (apps[i].id === app.id) {
                // close dropdown menu if current app deleted
                if (dropdownApp === apps[i])
                    dropdownMenu.open = false;

                apps.splice(i, 1);
                break;
            }
        }

        container.hidden = apps.length === 0;
    };

    // handle external updates to primary app
    editor.on('project:primaryApp', function (newValue, oldValue) {
        if (panel.hidden) return;

        if (!newValue) {
            publishedBuild.hidden = true;
            return;
        }

        publishedBuild.hidden = false;

        // check if we need to refresh UI
        var currentPrimary = document.getElementById('app-' + newValue);
        if (currentPrimary && currentPrimary.classList.contains('primary'))
            return;

        refreshApps();
    });

    // handle app created externally
    editor.on('messenger:app.new', function (data) {
        if (panel.hidden) return;

        // get app from server
        editor.call('apps:get', data.app.id, function (app) {
            // add app if it's not already inside the apps array
            var found = false;
            for (var i = 0; i < apps.length; i++) {
                if (apps[i].id === data.app.id) {
                    found = true;
                    break;
                }
            }

            if (! found) {
                apps.push(app);
                refreshApps();
            }
        });
    });

    // handle external delete
    editor.on('messenger:app.delete', function (data) {
        if (panel.hidden) return;

        removeApp(data.app);
    });

    // handle external app updates
    editor.on('messenger:app.update', function (data) {
        if (panel.hidden) return;

        // get app from server
        editor.call('apps:get', data.app.id, function (app) {
            for (var i = 0; i < apps.length; i++) {
                if (apps[i].id === app.id) {
                    apps[i] = app;
                }
            }
            refreshApps();
        });
    });

    // on show
    panel.on('show', function () {
        loadApps();

        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', false);
    });

    // on hide
    panel.on('hide', function () {
        apps = [];
        destroyTooltips();
        destroyEvents();

        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', true);
    });

    editor.on('viewport:hover', function(state) {
        if (state && ! panel.hidden) {
            setTimeout(function() {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });
});
