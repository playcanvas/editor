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
        var enableLegacyAmmoPhysics = !editor.call("users:isSuperUser") || projectSettings.get('useLegacyAmmoPhysics');
        var fieldPhysics = null;

        if (enableLegacyAmmoPhysics) {
            // enable 3d physics checkbox
            fieldPhysics = editor.call('attributes:addField', {
                parent: physicsPanel,
                name: 'Legacy Physics',
                type: 'checkbox',
                link: projectSettings,
                path: 'use3dPhysics'
            });
            editor.call('attributes:reference:attach',
                        'settings:project:physics',
                        fieldPhysics.parent.innerElement.firstChild.ui);
        }

        if (editor.call("users:isSuperUser")) {
            // add import ammo button
            var widget = editor.call('attributes:appendImportAmmo', physicsPanel);
            if (enableLegacyAmmoPhysics) {
                fieldPhysics.on('change', function(value) {
                    widget.disabled = value;
                });
                widget.disabled = projectSettings.get('use3dPhysics');
            }
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
    });

    // method for checking whether the current project has physics
    editor.method('project:settings:hasPhysics', function() {
        // check legacy physics include flag
        if ((projectSettings.get('useLegacyAmmoPhysics') || editor.call("users:isSuperUser")) &&
             projectSettings.get('use3dPhysics')) {
            return true;
        }

        // check for wasm ammo assets
        var ammoAssets = editor.call('assets:find', function(item) {
            var name = item.get('name');
            var type = item.get('type');
            return name.indexOf('ammo') >= 0 && (type === 'script' || type === 'wasm');
        });
        if (ammoAssets.length > 0) {
            return true;
        }

        return false;
    });

    // append the physics module controls to the provided panel
    editor.method('attributes:appendImportAmmo', function(panel) {
        var button = new pcui.Button({
            text: 'IMPORT AMMO',
            icon: 'E228'
        });
        var physicsLibraryGroup = new pcui.LabelGroup({
            field: button,
            text: 'Physics Library'
        });
        physicsLibraryGroup.style.margin = '3px';
        physicsLibraryGroup.label.style.width = '27%';
        physicsLibraryGroup.label.style.fontSize = '12px';
        panel.append(physicsLibraryGroup);

        if (!editor.call('permissions:write')) {
            physicsLibraryGroup.enabled = false;
        }
        var evtPermissions = editor.on('permissions:writeState', function (write) {
            physicsLibraryGroup.enabled = write;
        });
        panel.once('destroy', function () {
            if (evtPermissions) {
                evtPermissions.unbind();
                evtPermissions = null;
            }
        });

        // reference
        editor.call('attributes:reference:attach', 'settings:ammo', physicsLibraryGroup.label);

        editor.on('onPhysicsAmmoImported', function() {
            physicsLibraryGroup.disabled = true;
        });

        button.on('click', function() {
            // ensure legacy physics is disabled
            projectSettings.set('use3dPhysics', false);

            function addAmmoToProject() {
                Ajax( {
                    url:'{{url.api}}/store/items?name=ammo.js',
                    method:'GET',
                    auth: true,
                    data: { }
                }).on('load', function(status, data) {
                    if (data.length === 1) {
                        Ajax( {
                            url:'{{url.api}}/store/' + data[0].id.toString() + '/clone',
                            method: 'POST',
                            auth: true,
                            data: { scope: { type: 'project', id: config.project.id } },
                            notJson: true       // server response is empty
                        } ).on('load', function(status, data) {
                            editor.call('status:text', 'Ammo successfully imported');
                            editor.emit('onPhysicsAmmoImported');
                        } ).on('error', function(err) {
                            editor.call('status:error', 'Failed to import Ammo');
                        } );
                    }
                }).on('error', function(err) {
                    editor.call('status:error', 'Failed to import Ammo');
                });
            }

            // show popup if we think there already exists physics in the scene
            if (editor.call('project:settings:hasPhysics')) {
                editor.call('picker:confirm',
                'It appears your assets panel already contains the ammo physics modules. Do you want to continue?',
                function() { addAmmoToProject(); },
                {
                    yesText: 'Yes',
                    noText: 'Cancel'
                });
            } else {
                addAmmoToProject();
            }
        });

        return physicsLibraryGroup;
    });
});
