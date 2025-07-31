import { Button } from '@playcanvas/pcui';

import { LegacyTooltip } from '../../common/ui/tooltip.ts';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const toolbar = editor.call('layout.toolbar');

    let activeGizmo = null;
    const gizmoButtons = { };

    // create gizmo type buttons
    [{
        icon: 'E111',
        tooltip: 'Translate',
        op: 'translate'
    }, {
        icon: 'E113',
        tooltip: 'Rotate',
        op: 'rotate'
    }, {
        icon: 'E112',
        tooltip: 'Scale',
        op: 'scale'
    }, {
        icon: 'E142',
        tooltip: 'Resize Element Component',
        op: 'resize'
    }].forEach((item, index) => {
        const button = new Button({
            class: 'pc-icon',
            hidden: !editor.call('permissions:write'),
            icon: item.icon
        });
        button.op = item.op;

        gizmoButtons[item.op] = button;

        button.on('click', () => {
            if (activeGizmo.op === button.op) {
                return;
            }

            activeGizmo.class.remove('active');
            activeGizmo.tooltip.class.add('inactive');
            activeGizmo = button;
            activeGizmo.class.add('active');
            activeGizmo.tooltip.class.remove('inactive');

            editor.call('gizmo:type', button.op);
        });

        toolbar.append(button);

        button.tooltip = LegacyTooltip.attach({
            target: button.dom,
            text: item.tooltip,
            align: 'left',
            root: root
        });

        if (item.op === 'translate') {
            activeGizmo = button;
            button.class.add('active');
        } else {
            button.tooltip.class.add('inactive');
        }
    });

    // coordinate system
    const buttonWorld = new Button({
        class: ['pc-icon', 'active'],
        hidden: !editor.call('permissions:write'),
        icon: 'E118'
    });
    toolbar.append(buttonWorld);

    buttonWorld.on('click', () => {
        if (buttonWorld.class.contains('active')) {
            buttonWorld.class.remove('active');
            tooltipWorld.html = 'World / <span style="color:#fff">Local</span>';
        } else {
            buttonWorld.class.add('active');
            tooltipWorld.html = '<span style="color:#fff">World</span> / Local';
        }
        editor.call('gizmo:coordSystem', buttonWorld.class.contains('active') ? 'world' : 'local');
    });

    const tooltipWorld = LegacyTooltip.attach({
        target: buttonWorld.dom,
        align: 'left',
        root: root
    });
    tooltipWorld.html = '<span style="color:#fff">World</span> / Local';
    tooltipWorld.class.add('inactive');


    // toggle grid snap
    const buttonSnap = new Button({
        class: 'pc-icon',
        hidden: !editor.call('permissions:write'),
        icon: 'E116'
    });
    buttonSnap.on('click', () => {
        if (buttonSnap.class.contains('active')) {
            buttonSnap.class.remove('active');
            tooltipSnap.class.add('inactive');
        } else {
            buttonSnap.class.add('active');
            tooltipSnap.class.remove('inactive');
        }
        editor.call('gizmo:snap', buttonSnap.class.contains('active'));
    });
    toolbar.append(buttonSnap);

    const tooltipSnap = LegacyTooltip.attach({
        target: buttonSnap.dom,
        text: 'Snap',
        align: 'left',
        root: root
    });
    tooltipSnap.class.add('inactive');


    editor.on('permissions:writeState', (state) => {
        for (const key in gizmoButtons) {
            gizmoButtons[key].hidden = !state;
        }

        buttonWorld.hidden = !state;
        buttonSnap.hidden = !state;
    });


    // focus on entity
    const buttonFocus = new Button({
        class: 'pc-icon',
        enabled: false,
        icon: 'E117'
    });
    buttonFocus.on('click', () => {
        editor.call('viewport:focus');
    });
    toolbar.append(buttonFocus);

    editor.on('attributes:clear', () => {
        buttonFocus.enabled = false;
        tooltipFocus.class.add('inactive');
    });
    editor.on('attributes:inspect[*]', (type) => {
        buttonFocus.enabled = type === 'entity';
        if (type === 'entity') {
            tooltipFocus.class.remove('inactive');
        } else {
            tooltipFocus.class.add('inactive');
        }
    });

    const tooltipFocus = LegacyTooltip.attach({
        target: buttonFocus.dom,
        text: 'Focus',
        align: 'left',
        root: root
    });
    tooltipFocus.class.add('inactive');


    // translate hotkey
    editor.call('hotkey:register', 'gizmo:translate', {
        key: '1',
        callback: function () {
            if (editor.call('picker:isOpen:otherThan', 'curve')) return;
            gizmoButtons.translate.emit('click');
        }
    });

    // rotate hotkey
    editor.call('hotkey:register', 'gizmo:rotate', {
        key: '2',
        callback: function () {
            if (editor.call('picker:isOpen:otherThan', 'curve')) return;
            gizmoButtons.rotate.emit('click');
        }
    });

    // scale hotkey
    editor.call('hotkey:register', 'gizmo:scale', {
        key: '3',
        callback: function () {
            if (editor.call('picker:isOpen:otherThan', 'curve')) return;
            gizmoButtons.scale.emit('click');
        }
    });

    // resize hotkey
    editor.call('hotkey:register', 'gizmo:resize', {
        key: '4',
        callback: function () {
            if (editor.call('picker:isOpen:otherThan', 'curve')) return;
            gizmoButtons.resize.emit('click');
        }
    });

    // world/local hotkey
    editor.call('hotkey:register', 'gizmo:world', {
        key: 'l',
        callback: function () {
            if (editor.call('picker:isOpen:otherThan', 'curve')) return;
            buttonWorld.emit('click');
        }
    });

    // focus
    editor.call('hotkey:register', 'viewport:focus', {
        key: 'f',
        callback: function () {
            if (editor.call('picker:isOpen:otherThan', 'curve')) return;
            editor.call('viewport:focus');
        }
    });
});
