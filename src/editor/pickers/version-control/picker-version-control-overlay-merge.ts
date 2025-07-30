import { Button, Container, Label, SelectInput } from '@playcanvas/pcui';

import { handleCallback } from '../../../common/utils.ts';

editor.once('load', () => {
    const icon = document.createElement('div');
    icon.classList.add('icon');
    icon.innerHTML = '&#57880;';

    const overlay = editor.call('picker:versioncontrol:createOverlay', {
        message: 'Please wait until merging has been completed',
        icon: icon
    });
    overlay.class.add('merge-overlay');

    // switch to branch ui
    const panelSwitch = new Container({
        class: 'switch-branch'
    });
    const labelSwitch = new Label({
        text: 'Switch to'
    });
    panelSwitch.append(labelSwitch);

    const dropdownBranches = new SelectInput({
        placeholder: 'Select Branch'
    });
    panelSwitch.append(dropdownBranches);

    const btnSwitch = new Button({
        enabled: false,
        text: 'SWITCH'
    });
    panelSwitch.append(btnSwitch);
    overlay.innerElement.querySelector('.right').ui.append(panelSwitch);

    // switch to branch
    btnSwitch.on('click', () => {
        overlay.innerElement.classList.add('hidden'); // hide the inner contents of the overlay but not the whole overlay
        handleCallback(editor.api.globals.rest.branches.branchCheckout({
            branchId: dropdownBranches.value
        }), () => {
            // FIXME: Refresh handled by messenger
        });
    });

    // bottom buttons panel
    const panelButtons = new Container({
        class: 'buttons'
    });
    overlay.append(panelButtons);

    const panelBottom = new Container({
        class: 'buttons-bottom'
    });
    panelButtons.append(panelBottom);

    const btnForceStopMerge = new Button({
        enabled: editor.call('permissions:write'),
        text: 'FORCE STOP MERGE'
    });
    panelBottom.append(btnForceStopMerge);
    btnForceStopMerge.on('click', () => {
        editor.call('picker:confirm', 'Are you sure you want to force stop this merge process?', () => {
            overlay.innerElement.classList.add('hidden'); // hide the inner contents of the overlay but not the whole overlay

            handleCallback(editor.api.globals.rest.merge.mergeDelete({
                mergeId: config.self.branch.merge.id
            }), () => {
                // FIXME: Refresh handled by messenger
            });
        });
    });

    // load 100 branches
    let branches = [];
    const loadBranches = function (skip, fn) {
        const params = {};
        if (skip) {
            params.skip = skip;
        }
        handleCallback(editor.api.globals.rest.projects.projectBranches(params), (err, data) => {
            if (err) {
                log.error(err);
                return;
            }

            const lastBranch = data.result[data.result.length - 1];

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

    overlay.on('show', () => {
        loadBranches(null, () => {
            if (!branches.length) {
                return;
            }

            // update dropdown
            btnSwitch.disabled = false;
            dropdownBranches.options = branches.map((branch) => {
                return {
                    v: branch.id, t: branch.name
                };
            });
            dropdownBranches.value = branches[0].id;
        });
    });

    overlay.on('hide', () => {
        dropdownBranches.options = [];
        dropdownBranches.value = null;
        btnSwitch.disabled = true;
    });

    editor.method('picker:versioncontrol:mergeOverlay', () => {
        let fullName = config.self.branch.merge?.user.fullName;
        if (fullName && fullName.length > 33) {
            fullName = `${fullName.substring(0, 30)}...`;
        }

        overlay.setTitle(fullName ? `${fullName} is merging branches` : 'Merge in progress');
        overlay.hidden = false;
    });

    editor.method('picker:versioncontrol:mergeOverlay:hide', () => {
        overlay.hidden = true;
    });
});
