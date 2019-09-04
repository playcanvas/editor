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

        // enable 3d physics
        if (editor.call('settings:project').get('useLegacyAmmoPhysics')) {
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

        // ammo module button
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
        physicsPanel.append(physicsLibraryGroup);

        // reference
        editor.call('attributes:reference:attach', 'settings:ammo', physicsLibraryGroup.label);

        button.on('click', function() {
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
                        data: { scope: { type: 'project', id: config.project.id } }
                    } ).on('load', function(status, data) {
                        // done
                    });
                }
            });
        });
    });
});
