import { Button, Container, Label, Panel } from '@playcanvas/pcui';

import { convertDatetime } from '@/common/utils';

editor.once('load', () => {
    let leftBranch = null;
    let leftCheckpoint = null;
    let rightBranch = null;
    let rightCheckpoint = null;

    const panel = new Panel({
        headerText: 'DIFF',
        class: 'diff-checkpoints'
    });

    // close button
    const btnClose = new Button({
        text: '\uE132',
        class: 'close'
    });
    btnClose.on('click', () => {
        panel.hidden = true;
    });
    panel.header.dom.appendChild(btnClose.dom);

    // left checkpoint
    const panelLeft = new Container({
        class: ['checkpoint', 'checkpoint-left', 'empty']
    });
    panel.append(panelLeft);

    const labelLeftInfo = new Label({
        text: 'Select a checkpoint or a branch\'s current state',
        class: 'diff-info'
    });
    panelLeft.append(labelLeftInfo);

    const panelLeftContent = new Panel({
        headerText: 'title',
        class: 'checkpoint-content'
    });
    panelLeftContent.header.style.height = '28px';
    panelLeftContent.header.style.lineHeight = '28px';

    // clear button
    const btnClearLeft = new Button({
        text: '\uE132',
        class: 'close'
    });
    btnClearLeft.on('click', () => {
        editor.emit('checkpoint:diff:deselect', leftBranch, leftCheckpoint);
    });
    panelLeftContent.header.dom.appendChild(btnClearLeft.dom);

    const labelLeftCheckpoint = new Label({
        text: 'Left Checkpoint',
        class: 'title'
    });
    panelLeftContent.append(labelLeftCheckpoint);

    const labelLeftDesc = new Label({
        text: 'Description',
        class: 'desc'
    });
    panelLeftContent.append(labelLeftDesc);

    panelLeft.append(panelLeftContent);

    // arrow
    const labelArrow = new Label({
        text: '\uE166',
        class: 'arrow'
    });
    panel.append(labelArrow);

    // right checkpoint
    const panelRight = new Container({
        class: ['checkpoint', 'checkpoint-right', 'empty']
    });
    panel.append(panelRight);

    const labelRightInfo = new Label({
        text: 'Select a checkpoint or a branch\'s current state',
        class: 'diff-info'
    });
    panelRight.append(labelRightInfo);

    const panelRightContent = new Panel({
        headerText: 'title',
        class: 'checkpoint-content'
    });
    panelRightContent.header.style.height = '28px';
    panelRightContent.header.style.lineHeight = '28px';

    const labelRightCheckpoint = new Label({
        text: 'Right Checkpoint',
        class: 'title'
    });
    panelRightContent.append(labelRightCheckpoint);

    // clear button
    const btnClearRight = new Button({
        text: '\uE132',
        class: 'close'
    });
    btnClearRight.on('click', () => {
        editor.emit('checkpoint:diff:deselect', rightBranch, rightCheckpoint);
    });
    panelRightContent.header.dom.appendChild(btnClearRight.dom);

    const labelRightDesc = new Label({
        text: 'Description',
        class: 'desc'
    });
    panelRightContent.append(labelRightDesc);

    panelRight.append(panelRightContent);

    // compare button
    const btnCompare = new Button({
        text: 'COMPARE',
        class: 'compare'
    });
    btnCompare.disabled = true;
    panel.append(btnCompare);

    btnCompare.on('click', () => {
        panel.emit('diff',
            leftBranch.id,
            leftCheckpoint ? leftCheckpoint.id : null,
            rightBranch.id,
            rightCheckpoint ? rightCheckpoint.id : null
        );
    });

    // swap button
    const btnSwitch = new Button({
        text: 'SWAP',
        class: 'switch'
    });
    btnSwitch.disabled = true;
    panel.append(btnSwitch);

    btnSwitch.on('click', () => {
        const tempCheckpoint = leftCheckpoint;
        const tempBranch = leftBranch;
        setLeftCheckpoint(rightBranch, rightCheckpoint);
        setRightCheckpoint(tempBranch, tempCheckpoint);
    });

    const setCheckpointContent = function (panel: Record<string, unknown>, panelCheckpoint: Record<string, unknown>, labelCheckpoint: Record<string, unknown>, labelDesc: Record<string, unknown>, branch: Record<string, unknown> | null, checkpoint: Record<string, unknown> | null) {
        if (branch) {
            panelCheckpoint.headerText = branch.name;
        }

        if (checkpoint || branch) {
            labelCheckpoint.text = checkpoint ? checkpoint.description : 'Current State';
            let text;
            if (checkpoint) {
                text = `${convertDatetime(checkpoint.createdAt)} - ${checkpoint.id.substring(0, 7)}${checkpoint.user.fullName ? ` by ${checkpoint.user.fullName}` : ''}`;
            } else {
                text = `As of ${convertDatetime(Date.now())}`;
            }

            labelDesc.text = text;

            panel.class.remove('empty');
        } else {
            panel.class.add('empty');
        }
    };

    const setLeftCheckpoint = function (branch: Record<string, unknown> | null, checkpoint: Record<string, unknown> | null) {
        leftBranch = branch;
        leftCheckpoint = checkpoint;
        setCheckpointContent(panelLeft, panelLeftContent, labelLeftCheckpoint, labelLeftDesc, branch, checkpoint);

    };

    const setRightCheckpoint = function (branch: Record<string, unknown> | null, checkpoint: Record<string, unknown> | null) {
        rightBranch = branch;
        rightCheckpoint = checkpoint;
        setCheckpointContent(panelRight, panelRightContent, labelRightCheckpoint, labelRightDesc, branch, checkpoint);
    };

    const isLeft = function (branch: Record<string, unknown>, checkpoint: Record<string, unknown> | null) {
        if (leftBranch && branch.id === leftBranch.id) {
            return (checkpoint && leftCheckpoint && checkpoint.id === leftCheckpoint.id) ||
                   (!checkpoint && !leftCheckpoint);
        }
    };

    const isRight = function (branch: Record<string, unknown>, checkpoint: Record<string, unknown> | null) {
        if (rightBranch && branch.id === rightBranch.id) {
            return (checkpoint && rightCheckpoint && checkpoint.id === rightCheckpoint.id) ||
                   (!checkpoint && !rightCheckpoint);
        }
    };

    panel.onCheckpointSelected = function (branch: Record<string, unknown>, checkpoint: Record<string, unknown> | null) {
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

    panel.onCheckpointDeselected = function (branch: Record<string, unknown>, checkpoint: Record<string, unknown> | null) {
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
        let result = 0;
        if (leftCheckpoint || leftBranch) {
            result++;
        }
        if (rightCheckpoint || rightBranch) {
            result++;
        }
        return result;
    };

    panel.on('hide', () => {
        editor.emit('checkpoint:diff:deselect', leftBranch, leftCheckpoint);
        editor.emit('checkpoint:diff:deselect', rightBranch, rightCheckpoint);
    });

    editor.method('picker:versioncontrol:widget:diffCheckpoints:isCheckpointSelected', (branch, checkpoint) => {
        return isLeft(branch, checkpoint) || isRight(branch, checkpoint);
    });

    // Gets the diff checkpoints panel
    editor.method('picker:versioncontrol:widget:diffCheckpoints', () => {
        return panel;
    });
});
