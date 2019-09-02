editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');
    var projectSettings = editor.call('settings:project');

    var folded = true;

    // TODO: this flag should come from a flag on the project
    var useAmmoModule = true;

    editor.on('attributes:inspect[editorSettings]', function() {
        // physics
        var physicsPanel = editor.call('attributes:addPanel', {
            name: 'Physics'
        });
        physicsPanel.foldable = true;
        physicsPanel.folded = folded;
        physicsPanel.on('fold', function() { folded = true; });
        physicsPanel.on('unfold', function() { folded = false; });
        physicsPanel.class.add('component');

        // enable 3d physics
        if (!useAmmoModule) {
            var fieldPhysics = editor.call('attributes:addField', {
                parent: physicsPanel,
                name: 'Enable',
                type: 'checkbox',
                link: projectSettings,
                path: 'use3dPhysics'
            });
            editor.call('attributes:reference:attach', 'settings:project:physics', fieldPhysics.parent.innerElement.firstChild.ui);
        }

        // gravity
        var fieldGravity = editor.call('attributes:addField', {
            parent: physicsPanel,
            name: 'Gravity',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 2,
            step: .1,
            type: 'vec3',
            link: sceneSettings,
            path: 'physics.gravity'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:gravity', fieldGravity[0].parent.innerElement.firstChild.ui);

        // add ammo module button
        if (useAmmoModule) {
            var buttonPanel = new ui.Panel();
            buttonPanel.class.add('flex', 'component');
            physicsPanel.append(buttonPanel);

            var button = new ui.Button({
                text: 'Import Ammo modules into this project'
            });
            buttonPanel.append(button);

            var tooltipText = "Import asm.js and wasm.js modules into this project from the Playcanvas Store";

            Tooltip.attach({
                target: button.element,
                html:  tooltipText,
                align: 'right',
                root: editor.call('layout.root')
            });

            button.on('click', function() {
                Ajax( {
                    url:'{{url.api}}/store/items?name=Standard Ammo Modules',
                    method:'GET',
                    auth: true,
                    data: { }
                }).on('load', function(status, data) {
                    if (data.length === 1) {
                        Ajax( {
                            url:'{{url.api}}/store/' + data[0].id.toString() + '/clone',
                            method: 'POST',
                            auth: true,
                            data: { scope: { type: 'project', id: config.project.id } }
                        } ).on('load', function(status, data) {
                            // done
                        });
                    }
                });
            });
        }
    });
});
