editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');
    var projectSettings = editor.call('settings:project');

    var folded = true;

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

        // TODO: remove superuser clause once useLegacyAmmoPhysics has been deployed
        var enableLegacyAmmoPhysics = !!projectSettings.get('useLegacyAmmoPhysics');

        if (enableLegacyAmmoPhysics) {
            // enable 3d physics checkbox
            var fieldPhysics = editor.call('attributes:addField', {
                parent: physicsPanel,
                name: 'Enable Physics',
                type: 'checkbox',
                link: projectSettings,
                path: 'use3dPhysics'
            });
            editor.call('attributes:reference:attach',
                        'settings:project:physics',
                        fieldPhysics.parent.innerElement.firstChild.ui);
            fieldPhysics.on('change', function(value) {
                editor.emit('onUse3dPhysicsChanged', value);
            });
        }

        // add import ammo button
        editor.call('attributes:appendImportAmmo', physicsPanel);

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
    });

    // check legacy physics include flag
    editor.method('project:settings:hasLegacyPhysics', function() {
        return projectSettings.get('useLegacyAmmoPhysics') &&
               projectSettings.get('use3dPhysics');
    });

    // method for checking whether the current project has physics (either legacy or module)
    editor.method('project:settings:hasPhysics', function() {
        return editor.call('project:settings:hasLegacyPhysics') ||
                editor.call('project:module:hasModule', 'ammo');
    });

    // append the physics module controls to the provided panel
    editor.method('attributes:appendImportAmmo', function(panel) {
        // button
        var button = new pcui.Button({
            text: 'IMPORT AMMO',
            icon: 'E228'
        });
        button.on('click', function() {
            // ensure legacy physics is disabled
            projectSettings.set('use3dPhysics', false);
            // add the module
            editor.call('project:module:addModule', 'ammo.js', 'ammo');
        });

        // group
        var group = new pcui.LabelGroup({
            field: button,
            text: 'Physics Library'
        });
        group.style.margin = '3px';
        group.label.style.width = '27%';
        group.label.style.fontSize = '12px';
        panel.append(group);

        // reference
        editor.call('attributes:reference:attach', 'settings:ammo', group.label);

        // enable state is based on write permissions and state of legacy physics
        function updateEnableState() {
            group.enabled = !editor.call('project:settings:hasLegacyPhysics') &&
                             editor.call('permissions:write');
        }
        editor.on('permissions:writeState', function (write) {
            updateEnableState();
        });
        editor.on('onUse3dPhysicsChanged', function() {
            updateEnableState();
        })
        editor.on('onModuleImported', function(name) {
            if (name === 'ammo.js') {
                group.enabled = false;
            }
        });
        updateEnableState();

        return group;
    });
});
