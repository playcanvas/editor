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
        icon: 'E132',
        class: 'close'
    });
    btnClose.on('click', () => {
        panel.hidden = true;
    });
    panel.header.append(btnClose);

    // left checkpoint
    const containerLeft = new Container({
        class: ['checkpoint', 'checkpoint-left', 'empty']
    });
    panel.append(containerLeft);

    const labelLeftInfo = new Label({
        text: 'Select a checkpoint or a branch\'s current state',
        class: 'diff-info'
    });
    containerLeft.append(labelLeftInfo);

    const panelLeftContent = new Panel({
        headerText: 'title',
        class: 'checkpoint-content'
    });
    // clear button
    const btnClearLeft = new Button({
        icon: 'E132',
        class: 'close'
    });
    btnClearLeft.on('click', () => {
        editor.emit('checkpoint:diff:deselect', leftBranch, leftCheckpoint);
    });
    panelLeftContent.header.append(btnClearLeft);

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

    containerLeft.append(panelLeftContent);

    // arrow
    const labelArrow = new Label({
        text: '\uE166',
        class: 'arrow'
    });
    panel.append(labelArrow);

    // right checkpoint
    const containerRight = new Container({
        class: ['checkpoint', 'checkpoint-right', 'empty']
    });
    panel.append(containerRight);

    const labelRightInfo = new Label({
        text: 'Select a checkpoint or a branch\'s current state',
        class: 'diff-info'
    });
    containerRight.append(labelRightInfo);

    const panelRightContent = new Panel({
        headerText: 'title',
        class: 'checkpoint-content'
    });
    const labelRightCheckpoint = new Label({
        text: 'Right Checkpoint',
        class: 'title'
    });
    panelRightContent.append(labelRightCheckpoint);

    // clear button
    const btnClearRight = new Button({
        icon: 'E132',
        class: 'close'
    });
    btnClearRight.on('click', () => {
        editor.emit('checkpoint:diff:deselect', rightBranch, rightCheckpoint);
    });
    panelRightContent.header.append(btnClearRight);

    const labelRightDesc = new Label({
        text: 'Description',
        class: 'desc'
    });
    panelRightContent.append(labelRightDesc);

    containerRight.append(panelRightContent);

    // compare button
    const btnCompare = new Button({
        text: 'COMPARE',
        class: 'compare',
        enabled: false
    });
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
        icon: 'E128',
        class: 'switch',
        enabled: false
    });
    panel.append(btnSwitch);

    btnSwitch.on('click', () => {
        const tempCheckpoint = leftCheckpoint;
        const tempBranch = leftBranch;
        setLeftCheckpoint(rightBranch, rightCheckpoint);
        setRightCheckpoint(tempBranch, tempCheckpoint);
    });

    const setCheckpointContent = function (container: Container, panelCheckpoint: Panel, labelCheckpoint: Label, labelDesc: Label, branch: Record<string, unknown> | null, checkpoint: Record<string, unknown> | null) {
        if (branch) {
            panelCheckpoint.headerText = branch.name as string;
        }

        if (checkpoint || branch) {
            labelCheckpoint.text = checkpoint ? checkpoint.description as string : 'Current State';
            let text;
            if (checkpoint) {
                const user = checkpoint.user as Record<string, unknown>;
                text = `${convertDatetime(checkpoint.createdAt as string)} - ${(checkpoint.id as string).substring(0, 7)}${user.fullName ? ` by ${user.fullName}` : ''}`;
            } else {
                text = `As of ${convertDatetime(Date.now())}`;
            }

            labelDesc.text = text;

            container.class.remove('empty');
        } else {
            container.class.add('empty');
        }
    };

    const setLeftCheckpoint = function (branch: Record<string, unknown> | null, checkpoint: Record<string, unknown> | null) {
        leftBranch = branch;
        leftCheckpoint = checkpoint;
        setCheckpointContent(containerLeft, panelLeftContent, labelLeftCheckpoint, labelLeftDesc, branch, checkpoint);

    };

    const setRightCheckpoint = function (branch: Record<string, unknown> | null, checkpoint: Record<string, unknown> | null) {
        rightBranch = branch;
        rightCheckpoint = checkpoint;
        setCheckpointContent(containerRight, panelRightContent, labelRightCheckpoint, labelRightDesc, branch, checkpoint);
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
            btnCompare.enabled = true;
            btnSwitch.enabled = true;
        }
    };

    panel.onCheckpointDeselected = function (branch: Record<string, unknown>, checkpoint: Record<string, unknown> | null) {
        if (isLeft(branch, checkpoint)) {
            setLeftCheckpoint(null, null);
        } else if (isRight(branch, checkpoint)) {
            setRightCheckpoint(null, null);
        }

        if (panel.getSelectedCount() !== 2) {
            btnCompare.enabled = false;
            btnSwitch.enabled = false;
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
