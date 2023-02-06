editor.once('load', function () {
    var leftBranch = null;
    var leftCheckpoint = null;
    var rightBranch = null;
    var rightCheckpoint = null;

    var panel = new ui.Panel('DIFF');
    panel.class.add('diff-checkpoints');

    // close button
    var btnClose = new ui.Button({
        text: '&#57650;'
    });
    btnClose.class.add('close');
    btnClose.on('click', function () {
        panel.hidden = true;
    });
    panel.headerElement.appendChild(btnClose.element);

    // left checkpoint
    var panelLeft = new ui.Panel();
    panelLeft.class.add('checkpoint', 'checkpoint-left', 'empty');
    panel.append(panelLeft);

    var labelLeftInfo = new ui.Label({
        text: 'Select a checkpoint or a branch\'s current state'
    });
    labelLeftInfo.class.add('diff-info');
    panelLeft.append(labelLeftInfo);

    var panelLeftContent = new ui.Panel('title');
    panelLeftContent.class.add('checkpoint-content');

    // clear button
    var btnClearLeft = new ui.Button({
        text: '&#57650;'
    });
    btnClearLeft.class.add('close');
    btnClearLeft.on('click', function () {
        editor.emit('checkpoint:diff:deselect', leftBranch, leftCheckpoint);
    });
    panelLeftContent.headerElement.appendChild(btnClearLeft.element);

    var labelLeftCheckpoint = new ui.Label({
        text: 'Left Checkpoint'
    });
    labelLeftCheckpoint.renderChanges = false;
    labelLeftCheckpoint.class.add('title');
    panelLeftContent.append(labelLeftCheckpoint);

    var labelLeftDesc = new ui.Label({
        text: 'Description'
    });
    labelLeftDesc.renderChanges = false;
    labelLeftDesc.class.add('desc');
    panelLeftContent.append(labelLeftDesc);

    panelLeft.append(panelLeftContent);

    // arrow
    var labelArrow = new ui.Label({
        text: '&#57702;',
        unsafe: true
    });
    labelArrow.class.add('arrow');
    panel.append(labelArrow);

    // right checkpoint
    var panelRight = new ui.Panel();
    panelRight.class.add('checkpoint', 'checkpoint-right', 'empty');
    panel.append(panelRight);

    var labelRightInfo = new ui.Label({
        text: 'Select a checkpoint or a branch\'s current state'
    });
    labelRightInfo.renderChanges = false;
    labelRightInfo.class.add('diff-info');
    panelRight.append(labelRightInfo);

    var panelRightContent = new ui.Panel('title');
    panelRightContent.class.add('checkpoint-content');
    var labelRightCheckpoint = new ui.Label({
        text: 'Right Checkpoint'
    });
    labelRightCheckpoint.renderChanges = false;
    labelRightCheckpoint.class.add('title');
    panelRightContent.append(labelRightCheckpoint);

    // clear button
    var btnClearRight = new ui.Button({
        text: '&#57650;'
    });
    btnClearRight.class.add('close');
    btnClearRight.on('click', function () {
        editor.emit('checkpoint:diff:deselect', rightBranch, rightCheckpoint);
    });
    panelRightContent.headerElement.appendChild(btnClearRight.element);

    var labelRightDesc = new ui.Label({
        text: 'Description'
    });
    labelRightDesc.renderChanges = false;
    labelRightDesc.class.add('desc');
    panelRightContent.append(labelRightDesc);

    panelRight.append(panelRightContent);

    // compare button
    var btnCompare = new ui.Button({
        text: 'COMPARE'
    });
    btnCompare.class.add('compare');
    btnCompare.disabled = true;
    panel.append(btnCompare);

    btnCompare.on('click', function () {
        panel.emit('diff',
            leftBranch.id,
            leftCheckpoint ? leftCheckpoint.id : null,
            rightBranch.id,
            rightCheckpoint ? rightCheckpoint.id : null
        );
    });

    // swap button
    var btnSwitch = new ui.Button({
        text: 'SWAP'
    });
    btnSwitch.class.add('switch');
    btnSwitch.disabled = true;
    panel.append(btnSwitch);

    btnSwitch.on('click', function () {
        var tempCheckpoint = leftCheckpoint;
        var tempBranch = leftBranch;
        setLeftCheckpoint(rightBranch, rightCheckpoint);
        setRightCheckpoint(tempBranch, tempCheckpoint);
    });

    var setCheckpointContent = function (panel, panelCheckpoint, labelCheckpoint, labelDesc, branch, checkpoint) {
        if (branch) {
            panelCheckpoint.header = branch.name;
        }

        if (checkpoint || branch) {
            labelCheckpoint.text = checkpoint ? checkpoint.description : 'Current State';
            var text;
            if (checkpoint) {
                text = editor.call('datetime:convert', checkpoint.createdAt) + ' - ' + checkpoint.id.substring(0, 7) + (checkpoint.user.fullName ? ' by ' + checkpoint.user.fullName : '');
            } else {
                text = 'As of ' + editor.call('datetime:convert', Date.now());
            }

            labelDesc.text = text;

            panel.class.remove('empty');
        } else {
            panel.class.add('empty');
        }
    };

    var setLeftCheckpoint = function (branch, checkpoint) {
        leftBranch = branch;
        leftCheckpoint = checkpoint;
        setCheckpointContent(panelLeft, panelLeftContent, labelLeftCheckpoint, labelLeftDesc, branch, checkpoint);

    };

    var setRightCheckpoint = function (branch, checkpoint) {
        rightBranch = branch;
        rightCheckpoint = checkpoint;
        setCheckpointContent(panelRight, panelRightContent, labelRightCheckpoint, labelRightDesc, branch, checkpoint);
    };

    var isLeft = function (branch, checkpoint) {
        if (leftBranch && branch.id === leftBranch.id) {
            return (checkpoint && leftCheckpoint && checkpoint.id === leftCheckpoint.id) ||
                   (!checkpoint && !leftCheckpoint);
        }
    };

    var isRight = function (branch, checkpoint) {
        if (rightBranch && branch.id === rightBranch.id) {
            return (checkpoint && rightCheckpoint && checkpoint.id === rightCheckpoint.id) ||
                   (!checkpoint && !rightCheckpoint);
        }
    };

    panel.onCheckpointSelected = function (branch, checkpoint) {
        if (!leftCheckpoint && !leftBranch) {
            setLeftCheckpoint(branch, checkpoint);
        } else {
            setRightCheckpoint(branch, checkpoint);
        }

        if (panel.getSelectedCount() === 2) {
            btnCompare.disabled = false;
            btnSwitch.disabled = false;
        }
    };

    panel.onCheckpointDeselected = function (branch, checkpoint) {
        if (isLeft(branch, checkpoint)) {
            setLeftCheckpoint(null, null);
        } else if (isRight(branch, checkpoint)) {
            setRightCheckpoint(null, null);
        }

        if (panel.getSelectedCount() !== 2) {
            btnCompare.disabled = true;
            btnSwitch.disabled = true;
        }
    };

    panel.getSelectedCount = function () {
        var result = 0;
        if (leftCheckpoint || leftBranch) result++;
        if (rightCheckpoint || rightBranch) result++;
        return result;
    };

    panel.on('hide', function () {
        editor.emit('checkpoint:diff:deselect', leftBranch, leftCheckpoint);
        editor.emit('checkpoint:diff:deselect', rightBranch, rightCheckpoint);
    });

    editor.method('picker:versioncontrol:widget:diffCheckpoints:isCheckpointSelected', function (branch, checkpoint) {
        return isLeft(branch, checkpoint) || isRight(branch, checkpoint);
    });

    // Gets the diff checkpoints panel
    editor.method('picker:versioncontrol:widget:diffCheckpoints', function () {
        return panel;
    });
});
