editor.once('load', function() {
    'use strict';

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
        button.element.title = item.tooltip;
        button.class.add('icon');

        gizmoButtons[item.op] = button;

        button.on('click', function () {
            if (activeGizmo.op === this.op)
                return;

            activeGizmo.class.remove('active');
            activeGizmo = this;
            activeGizmo.class.add('active');

            var framework = editor.call('viewport:framework');
            if (framework)
                framework.setActiveGizmoType(this.op);
        });

        toolbar.append(button);

        if (item.op === 'translate') {
            activeGizmo = button;
            button.class.add('active');
        }
    });


    // coordinate system
    var buttonWorld = new ui.Button({
        text: '&#58645;'
    });
    buttonWorld.element.title = 'World / Local';
    buttonWorld.class.add('icon', 'active');
    toolbar.append(buttonWorld);

    buttonWorld.on('click', function () {
        if (this.class.contains('active')) {
            this.class.remove('active');
        } else {
            this.class.add('active');
        }
        var framework = editor.call('viewport:framework');
        if (framework)
            framework.setGizmoCoordinateSystem(this.class.contains('active') ? 'local' : 'world');
    });


    // toggle grid snap
    var buttonSnap = new ui.Button({
        text: '&#58663;'
    });
    buttonSnap.element.title = 'Snapping';
    buttonSnap.class.add('icon');
    buttonSnap.on('click', function () {
        if (this.class.contains('active')) {
            this.class.remove('active');
        } else {
            this.class.add('active');
        }
        var framework = editor.call('viewport:framework');
        if (framework)
            framework.setSnapToClosestIncrement(this.class.contains('active'));
    });
    toolbar.append(buttonSnap);


    // focus on entity
    var buttonFocus = new ui.Button({
        text: '&#58756;'
    });
    buttonFocus.element.title = 'Focus on Selection';
    buttonFocus.class.add('icon');
    buttonFocus.on('click', function() {
        var framework = editor.call('viewport:framework');
        if (framework)
            framework.frameSelection();
    });
    toolbar.append(buttonFocus);


    // shortcuts
    window.addEventListener('keydown', function (e) {
        var framework = editor.call('viewport:framework');
        if (! framework || (e.target && e.target.tagName.toLowerCase() === 'input'))
            return;

        switch (e.keyCode) {
            case 49: // 1:
                gizmoButtons['translate'].emit('click');
                // framework.setActiveGizmoType('translate');
                break;
            case 50: // 2:
                gizmoButtons['rotate'].emit('click');
                // framework.setActiveGizmoType('rotate');
                break;
            case 51: // 3:
                gizmoButtons['scale'].emit('click');
                // framework.setActiveGizmoType('scale');
                break;
            case 70: // F:
                framework.frameSelection();
                break;
        }
    });

});
