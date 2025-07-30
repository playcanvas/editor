import { LegacyButton } from '../../../common/ui/button.ts';
import { LegacyLabel } from '../../../common/ui/label.ts';
import { LegacyPanel } from '../../../common/ui/panel.ts';
import { convertDatetime } from '../../../common/utils.ts';

editor.once('load', () => {
    let leftBranch = null;
    let leftCheckpoint = null;
    let rightBranch = null;
    let rightCheckpoint = null;

    const panel = new LegacyPanel('DIFF');
    panel.class.add('diff-checkpoints');

    // close button
    const btnClose = new LegacyButton({
        text: '&#57650;'
    });
    btnClose.class.add('close');
    btnClose.on('click', () => {
        panel.hidden = true;
    });
    panel.headerElement.appendChild(btnClose.element);

    // left checkpoint
    const panelLeft = new LegacyPanel();
    panelLeft.class.add('checkpoint', 'checkpoint-left', 'empty');
    panel.append(panelLeft);

    const labelLeftInfo = new LegacyLabel({
        text: 'Select a checkpoint or a branch\'s current state'
    });
    labelLeftInfo.class.add('diff-info');
    panelLeft.append(labelLeftInfo);

    const panelLeftContent = new LegacyPanel('title');
    panelLeftContent.class.add('checkpoint-content');

    // clear button
    const btnClearLeft = new LegacyButton({
        text: '&#57650;'
    });
    btnClearLeft.class.add('close');
    btnClearLeft.on('click', () => {
        editor.emit('checkpoint:diff:deselect', leftBranch, leftCheckpoint);
    });
    panelLeftContent.headerElement.appendChild(btnClearLeft.element);

    const labelLeftCheckpoint = new LegacyLabel({
        text: 'Left Checkpoint'
    });
    labelLeftCheckpoint.renderChanges = false;
    labelLeftCheckpoint.class.add('title');
    panelLeftContent.append(labelLeftCheckpoint);

    const labelLeftDesc = new LegacyLabel({
        text: 'Description'
    });
    labelLeftDesc.renderChanges = false;
    labelLeftDesc.class.add('desc');
    panelLeftContent.append(labelLeftDesc);

    panelLeft.append(panelLeftContent);

    // arrow
    const labelArrow = new LegacyLabel({
        text: '&#57702;',
        unsafe: true
    });
    labelArrow.class.add('arrow');
    panel.append(labelArrow);

    // right checkpoint
    const panelRight = new LegacyPanel();
    panelRight.class.add('checkpoint', 'checkpoint-right', 'empty');
    panel.append(panelRight);

    const labelRightInfo = new LegacyLabel({
        text: 'Select a checkpoint or a branch\'s current state'
    });
    labelRightInfo.renderChanges = false;
    labelRightInfo.class.add('diff-info');
    panelRight.append(labelRightInfo);

    const panelRightContent = new LegacyPanel('title');
    panelRightContent.class.add('checkpoint-content');
    const labelRightCheckpoint = new LegacyLabel({
        text: 'Right Checkpoint'
    });
    labelRightCheckpoint.renderChanges = false;
    labelRightCheckpoint.class.add('title');
    panelRightContent.append(labelRightCheckpoint);

    // clear button
    const btnClearRight = new LegacyButton({
        text: '&#57650;'
    });
    btnClearRight.class.add('close');
    btnClearRight.on('click', () => {
        editor.emit('checkpoint:diff:deselect', rightBranch, rightCheckpoint);
    });
    panelRightContent.headerElement.appendChild(btnClearRight.element);

    const labelRightDesc = new LegacyLabel({
        text: 'Description'
    });
    labelRightDesc.renderChanges = false;
    labelRightDesc.class.add('desc');
    panelRightContent.append(labelRightDesc);

    panelRight.append(panelRightContent);

    // compare button
    const btnCompare = new LegacyButton({
        text: 'COMPARE'
    });
    btnCompare.class.add('compare');
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
    const btnSwitch = new LegacyButton({
        text: 'SWAP'
    });
    btnSwitch.class.add('switch');
    btnSwitch.disabled = true;
    panel.append(btnSwitch);

    btnSwitch.on('click', () => {
        const tempCheckpoint = leftCheckpoint;
        const tempBranch = leftBranch;
        setLeftCheckpoint(rightBranch, rightCheckpoint);
        setRightCheckpoint(tempBranch, tempCheckpoint);
    });

    const setCheckpointContent = function (panel, panelCheckpoint, labelCheckpoint, labelDesc, branch, checkpoint) {
        if (branch) {
            panelCheckpoint.header = branch.name;
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

    const isLeft = function (branch, checkpoint) {
        if (leftBranch && branch.id === leftBranch.id) {
            return (checkpoint && leftCheckpoint && checkpoint.id === leftCheckpoint.id) ||
                   (!checkpoint && !leftCheckpoint);
        }
    };

    const isRight = function (branch, checkpoint) {
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
        let result = 0;
        if (leftCheckpoint || leftBranch) result++;
        if (rightCheckpoint || rightBranch) result++;
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
