editor.once('load', function() {
    'use strict';

    var folded = true;
    var changing = false;

    editor.on('attributes:inspect[designerSettings]', function() {
        var settings = editor.call('project:settings');

        var panel = editor.call('attributes:addPanel', {
            name: 'Project'
        });
        panel.foldable = true;
        panel.folded = folded;
        panel.on('fold', function() { folded = true; });
        panel.on('unfold', function() { folded = false; });
        panel.class.add('component');
        // reference
        editor.call('attributes:reference:settings:project:attach', panel, panel.headerElement);

        var fieldWidth = editor.call('attributes:addField', {
            parent: panel,
            name: 'Resolution',
            placeholder: 'w',
            type: 'number',
            link: settings,
            path: 'width',
            precision: 0,
            min: 1
        });

        editor.call('attributes:reference:settings:project:width:attach', fieldWidth);

        var fieldHeight = editor.call('attributes:addField', {
            panel: fieldWidth.parent,
            placeholder: 'h',
            type: 'number',
            link: settings,
            path: 'height',
            precision: 0,
            min: 1
        });
        editor.call('attributes:reference:settings:project:height:attach', fieldHeight);

        var fieldResolutionMode = editor.call('attributes:addField', {
            panel: fieldWidth.parent,
            type: 'string',
            enum: {
                'FIXED': 'Fixed',
                'AUTO': 'Auto'
            },
            link: settings,
            path: 'resolution_mode'
        });
        editor.call('attributes:reference:settings:project:resolutionMode:attach', fieldResolutionMode);

        var fieldFillMode = editor.call('attributes:addField', {
            parent: panel,
            name: 'Fill mode',
            type: 'string',
            enum: {
                'NONE': 'None',
                'KEEP_ASPECT': 'Keep aspect ratio',
                'FILL_WINDOW': 'Fill window',
            },
            link: settings,
            path: 'fill_mode'
        });
        editor.call('attributes:reference:settings:project:fillMode:attach', fieldFillMode.parent.innerElement.firstChild.ui);

        var fieldPhysics = editor.call('attributes:addField', {
            parent: panel,
            name: '3D Physics',
            type: 'checkbox'
        });
        editor.call('attributes:reference:settings:project:physics:attach', fieldPhysics.parent.innerElement.firstChild.ui);

        fieldPhysics.value = settings.get('libraries').indexOf('physics-engine-3d') !== -1;
        fieldPhysics.on('change', function (value) {
            if (changing) return;
            changing = true;
            if (value) {
                settings.set('libraries', ['physics-engine-3d']);
            } else {
                settings.set('libraries', []);
            }
            changing = false;
        });

        var fieldPixelRatio = editor.call('attributes:addField', {
            parent: panel,
            name: 'Device Pixel Ratio',
            type: 'checkbox',
            link: settings,
            path: 'use_device_pixel_ratio'
        });
        editor.call('attributes:reference:settings:project:pixelRatio:attach', fieldPixelRatio.parent.innerElement.firstChild.ui);

        var evtChange = settings.on('*:set', function (path, value, oldValue) {
            if (path === 'libraries') {
                if (changing) return;
                changing = true;
                fieldPhysics.value = value.indexOf('physics-engine-3d') !== -1;
                changing = false;
            }
        });

        panel.on('destroy', function () {
            evtChange.unbind();
        });
    });

});
