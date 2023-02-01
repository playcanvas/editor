editor.once('load', function () {
    'use strict';

    var icon = document.createElement('div');
    icon.classList.add('icon');
    icon.innerHTML = '&#57880;';

    var overlay = editor.call('picker:versioncontrol:createOverlay', {
        message: 'Please wait until merging has been completed',
        icon: icon
    });
    overlay.class.add('merge-overlay');

    // switch to branch ui
    var panelSwitch = new ui.Panel();
    panelSwitch.class.add('switch-branch');
    var labelSwitch = new ui.Label({
        text: 'Switch to'
    });
    panelSwitch.append(labelSwitch);

    var dropdownBranches = new ui.SelectField({
        placeholder: 'Select Branch'
    });
    panelSwitch.append(dropdownBranches);

    var btnSwitch = new ui.Button({
        text: 'SWITCH'
    });
    btnSwitch.disabled = true;
    panelSwitch.append(btnSwitch);
    overlay.innerElement.querySelector('.right').ui.append(panelSwitch);

    // If we are currently in a scene this will first request the
    // scene from the server. If the scene no longer exists then we will
    // refresh to the Project URL. If the scene exists then just refresh the browser window
    var refresh = function () {
        setTimeout(function () {
            if (config.scene && config.scene.id) {
                editor.call('scenes:get', config.scene.id, function (err, data) {
                    if (err || !data) {
                        window.location = '/editor/project/' + config.project.id + window.location.search;
                    } else {
                        window.location.reload();
                    }
                });
            } else {
                window.location.reload();
            }
        }, 1000);
    };

    // switch to branch
    btnSwitch.on('click', function () {
        overlay.innerElement.classList.add('hidden'); // hide the inner contents of the overlay but not the whole overlay
        editor.call('branches:checkout', dropdownBranches.value, refresh);
    });

    // bottom buttons panel
    var panelButtons = new ui.Panel();
    panelButtons.class.add('buttons');
    overlay.append(panelButtons);

    var btnForceStopMerge = new ui.Button({
        text: 'FORCE STOP MERGE'
    });
    btnForceStopMerge.disabled = !editor.call('permissions:write');
    panelButtons.append(btnForceStopMerge);
    btnForceStopMerge.on('click', function () {
        editor.call('picker:confirm', 'Are you sure you want to force stop this merge process?', function () {
            overlay.innerElement.classList.add('hidden'); // hide the inner contents of the overlay but not the whole overlay
            editor.call('branches:forceStopMerge', config.self.branch.merge.id, function (err, data) {
                window.location.reload();
            });
        });
    });

    // load 100 branches
    var branches = [];
    var loadBranches = function (skip, fn) {
        var params = {};
        if (skip) {
            params.skip = skip;
        }
        editor.call('branches:list', params, function (err, data) {
            if (err) {
                log.error(err);
                return;
            }

            var lastBranch = data.result[data.result.length - 1];

            // remove 'our' branch
            for (let i = 0; i < data.result.length; i++) {
                if (data.result[i].id === config.self.branch.id) {
                    data.result.splice(i, 1);
                    break;
                }
            }

            // concatenate result and load more branches
            branches = branches.concat(data.result);
            if (lastBranch && data.pagination.hasMore && branches.length < 100) {
                loadBranches(lastBranch.id, fn);
            } else {
                fn();
            }
        });
    };

    overlay.on('show', function () {
        loadBranches(null, function () {
            if (!branches.length) {
                return;
            }

            // update dropdown
            btnSwitch.disabled = false;
            dropdownBranches._updateOptions(branches.map(function (branch) {
                return {
                    v: branch.id, t: branch.name
                };
            }));
            dropdownBranches.value = branches[0].id;
        });
    });

    overlay.on('hide', function () {
        dropdownBranches._updateOptions({});
        dropdownBranches.value = null;
        btnSwitch.disabled = true;
    });

    editor.method('picker:versioncontrol:mergeOverlay', function () {
        var fullName = config.self.branch.merge.user.fullName;
        if (fullName && fullName.length > 33) {
            fullName = fullName.substring(0, 30) + '...';
        }

        overlay.setTitle(fullName ? fullName + ' is merging branches' : 'Merge in progress');
        overlay.hidden = false;
    });

    editor.method('picker:versioncontrol:mergeOverlay:hide', function () {
        overlay.hidden = true;
    });
});
