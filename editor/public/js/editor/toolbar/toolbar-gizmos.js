editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var toolbar = editor.call('layout.toolbar');

    var activeGizmo = null;
    var gizmoButtons = { };

    // create gizmo type buttons
    [{
        icon: '&#58454;',
        tooltip: 'Translate',
        op: 'translate'
    }, {
        icon: '&#57670;',
        tooltip: 'Rotate',
        op: 'rotate'
    }, {
        icon: '&#57667;',
        tooltip: 'Scale',
        op: 'scale'
    }].forEach(function (item) {
        var button = new ui.Button({
            text: item.icon
        });
        button.op = item.op;
        button.class.add('icon');

        gizmoButtons[item.op] = button;

        button.on('click', function () {
            if (activeGizmo.op === this.op)
                return;

            activeGizmo.class.remove('active');
            activeGizmo.tooltip.class.add('innactive');
            activeGizmo = this;
            activeGizmo.class.add('active');
            activeGizmo.tooltip.class.remove('innactive');

            var framework = editor.call('viewport:framework');
            if (framework)
                framework.setActiveGizmoType(this.op);
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
    var buttonWorld = new ui.Button({
        text: '&#58645;'
    });
    buttonWorld.class.add('icon', 'active');
    toolbar.append(buttonWorld);

    buttonWorld.on('click', function () {
        if (this.class.contains('active')) {
            this.class.remove('active');
            tooltipWorld.html = 'World / <span style="color:#fff">Local</span>';
        } else {
            this.class.add('active');
            tooltipWorld.html = '<span style="color:#fff">World</span> / Local';
        }
        var framework = editor.call('viewport:framework');
        if (framework)
            framework.setGizmoCoordinateSystem(this.class.contains('active') ? 'world' : 'local');
    });

    var tooltipWorld = Tooltip.attach({
        target: buttonWorld.element,
        align: 'left',
        root: root
    });
    tooltipWorld.html = '<span style="color:#fff">World</span> / Local';
    tooltipWorld.class.add('innactive');


    // toggle grid snap
    var buttonSnap = new ui.Button({
        text: '&#58663;'
    });
    buttonSnap.class.add('icon');
    buttonSnap.on('click', function () {
        if (this.class.contains('active')) {
            this.class.remove('active');
            tooltipSnap.class.add('innactive');
        } else {
            this.class.add('active');
            tooltipSnap.class.remove('innactive');
        }
        var framework = editor.call('viewport:framework');
        if (framework)
            framework.setSnapToClosestIncrement(this.class.contains('active'));
    });
    toolbar.append(buttonSnap);

    var tooltipSnap = Tooltip.attach({
        target: buttonSnap.element,
        text: 'Snap',
        align: 'left',
        root: root
    });
    tooltipSnap.class.add('innactive');


    // focus on entity
    var buttonFocus = new ui.Button({
        text: '&#58756;'
    });
    buttonFocus.disabled = true;
    buttonFocus.class.add('icon');
    buttonFocus.on('click', function() {
        var framework = editor.call('viewport:framework');
        if (framework)
            framework.frameSelection();
    });
    toolbar.append(buttonFocus);

    editor.on('attributes:clear', function() {
        buttonFocus.disabled = true;
        tooltipFocus.class.add('innactive');
    });
    editor.on('attributes:inspect[*]', function(type) {
        buttonFocus.disabled = type !== 'entity';
        if (type === 'entity') {
            tooltipFocus.class.remove('innactive');
        } else {
            tooltipFocus.class.add('innactive');
        }
    });

    var tooltipFocus = Tooltip.attach({
        target: buttonFocus.element,
        text: 'Focus',
        align: 'left',
        root: root
    });
    tooltipFocus.class.add('innactive');


    // translate hotkey
    editor.call('hotkey:register', 'gizmo:translate', {
        key: '1',
        callback: function() {
            gizmoButtons['translate'].emit('click');
        }
    });

    // rotate hotkey
    editor.call('hotkey:register', 'gizmo:rotate', {
        key: '2',
        callback: function() {
            gizmoButtons['rotate'].emit('click');
        }
    });

    // scale hotkey
    editor.call('hotkey:register', 'gizmo:scale', {
        key: '3',
        callback: function() {
            gizmoButtons['scale'].emit('click');
        }
    });

    // focus
    editor.call('hotkey:register', 'viewport:focus', {
        key: 'f',
        callback: function() {
            var framework = editor.call('viewport:framework');
            if (framework)
                framework.frameSelection();
        }
    });
});
