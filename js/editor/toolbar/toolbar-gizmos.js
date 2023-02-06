import { Button } from '@playcanvas/pcui';

editor.once('load', function () {
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
    }].forEach(function (item, index) {
        const button = new Button({
            icon: item.icon
        });
        button.hidden = !editor.call('permissions:write');
        button.op = item.op;
        button.class.add('pc-icon');

        gizmoButtons[item.op] = button;

        button.on('click', function () {
            if (activeGizmo.op === this.op)
                return;

            activeGizmo.class.remove('active');
            activeGizmo.tooltip.class.add('innactive');
            activeGizmo = this;
            activeGizmo.class.add('active');
            activeGizmo.tooltip.class.remove('innactive');

            editor.call('gizmo:type', this.op);
        });

        toolbar.append(button);

        button.tooltip = Tooltip.attach({
            target: button.element,
            text: item.tooltip,
            align: 'left',
            root: root
        });

        if (item.op === 'translate') {
            activeGizmo = button;
            button.class.add('active');
        } else {
            button.tooltip.class.add('innactive');
        }
    });

    // coordinate system
    const buttonWorld = new Button({
        icon: 'E118'
    });
    buttonWorld.hidden = !editor.call('permissions:write');
    buttonWorld.class.add('pc-icon', 'active');
    toolbar.append(buttonWorld);

    buttonWorld.on('click', function () {
        if (this.class.contains('active')) {
            this.class.remove('active');
            tooltipWorld.html = 'World / <span style="color:#fff">Local</span>';
        } else {
            this.class.add('active');
            tooltipWorld.html = '<span style="color:#fff">World</span> / Local';
        }
        editor.call('gizmo:coordSystem', this.class.contains('active') ? 'world' : 'local');
    });

    const tooltipWorld = Tooltip.attach({
        target: buttonWorld.element,
        align: 'left',
        root: root
    });
    tooltipWorld.html = '<span style="color:#fff">World</span> / Local';
    tooltipWorld.class.add('innactive');


    // toggle grid snap
    const buttonSnap = new Button({
        icon: 'E116'
    });
    buttonSnap.hidden = !editor.call('permissions:write');
    buttonSnap.class.add('pc-icon');
    buttonSnap.on('click', function () {
        if (this.class.contains('active')) {
            this.class.remove('active');
            tooltipSnap.class.add('innactive');
        } else {
            this.class.add('active');
            tooltipSnap.class.remove('innactive');
        }
        editor.call('gizmo:snap', this.class.contains('active'));
    });
    toolbar.append(buttonSnap);

    const tooltipSnap = Tooltip.attach({
        target: buttonSnap.element,
        text: 'Snap',
        align: 'left',
        root: root
    });
    tooltipSnap.class.add('innactive');


    editor.on('permissions:writeState', function (state) {
        for (const key in gizmoButtons) {
            gizmoButtons[key].hidden = !state;
        }

        buttonWorld.hidden = !state;
        buttonSnap.hidden = !state;
    });


    // focus on entity
    const buttonFocus = new Button({
        icon: 'E117'
    });
    buttonFocus.disabled = true;
    buttonFocus.class.add('pc-icon');
    buttonFocus.on('click', function () {
        editor.call('viewport:focus');
    });
    toolbar.append(buttonFocus);

    editor.on('attributes:clear', function () {
        buttonFocus.disabled = true;
        tooltipFocus.class.add('innactive');
    });
    editor.on('attributes:inspect[*]', function (type) {
        buttonFocus.disabled = type !== 'entity';
        if (type === 'entity') {
            tooltipFocus.class.remove('innactive');
        } else {
            tooltipFocus.class.add('innactive');
        }
    });

    const tooltipFocus = Tooltip.attach({
        target: buttonFocus.element,
        text: 'Focus',
        align: 'left',
        root: root
    });
    tooltipFocus.class.add('innactive');


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
