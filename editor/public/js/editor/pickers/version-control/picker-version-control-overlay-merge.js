editor.once('load', function () {
    'use strict';

    var icon = document.createElement('div');
    icon.classList.add('icon');
    icon.innerHTML = '&#57880;';

    var overlay = editor.call('picker:versioncontrol:createOverlay', {
        title: 'Merge in progress...',
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

    // switch to branch
    btnSwitch.on('click', function () {
        overlay.innerElement.classList.add('hidden'); // hide the inner contents of the overlay but not the whole overlay
        editor.call('branches:checkout', dropdownBranches.value, function (err, data) {
            window.location.reload();
        });
    });

    // bottom buttons panel
    var panelButtons = new ui.Panel();
    panelButtons.class.add('buttons');
    overlay.append(panelButtons);

    var btnForceStopMerge = new ui.Button({
        text: 'FORCE STOP MERGE'
    });
    btnForceStopMerge.disabled = ! editor.call('permissions:write');
    panelButtons.append(btnForceStopMerge);
    btnForceStopMerge.on('click', function () {
        overlay.innerElement.classList.add('hidden'); // hide the inner contents of the overlay but not the whole overlay
        editor.call('branches:forceStopMerge', config.self.branch.merge.id, function (err, data) {
            window.location.reload();
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
                console.error(err);
                return;
            }

            // remove 'our' branch
            for (var i = 0; i < data.result.length; i++) {
                if (data.result[i].id === config.self.branch.id) {
                    data.result.splice(i, 1);
                    break;
                }
            }

            // concatenate result and load more branches
            branches = branches.concat(data.result);
            if (data.pagination.hasMore && branches.length < 100) {
                loadBranches(data.result[data.result.length - 1]);
            } else {
                fn();
            }
        });
    };

    loadBranches(null, function () {
        if (! branches.length) {
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

    editor.method('picker:versioncontrol:mergeOverlay', function () {
        overlay.hidden = false;
    });
});
