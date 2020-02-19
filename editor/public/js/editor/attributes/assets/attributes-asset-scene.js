editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'scene' || ! assets[0].get('source'))
            return;
        const hasPcuiAssetInspectors = editor.call('users:hasFlag', 'hasPcuiAssetInspectors');
        if (hasPcuiAssetInspectors)
            return;

        var asset = assets[0];
        var events = [ ];

        // contents
        var panelContents = editor.call('attributes:addPanel', {
            name: 'Contents'
        });
        panelContents.class.add('component');
        // reference
        editor.call('attributes:reference:attach', 'asset:scene:contents', panelContents, panelContents.headerElement);


        var labelEmptyMeta = new ui.Label({
            text: 'no contents information available'
        });
        labelEmptyMeta.hidden = !! asset.get('meta');
        panelContents.append(labelEmptyMeta);


        // meta
        var panelMeta = editor.call('attributes:addPanel');
        panelMeta.hidden = ! asset.get('meta');
        events.push(asset.on('meta:set', function() {
            panelMeta.hidden = false;
            labelEmptyMeta.hidden = true;
        }));
        events.push(asset.on('meta:unset', function() {
            panelMeta.hidden = true;
            labelEmptyMeta.hidden = false;
        }));
        panelContents.append(panelMeta);


        // animation
        var fieldAnimation = editor.call('attributes:addField', {
            parent: panelMeta,
            name: 'Animation'
        });
        var animationCheck = function(available) {
            if (available) {
                fieldAnimation.value = 'yes';
            } else {
                fieldAnimation.value = 'no';
            }
        };
        animationCheck(asset.get('meta.animation.available'));
        events.push(asset.on('meta.animation.available:set', animationCheck));


        // textures
        var fieldTextures = editor.call('attributes:addField', {
            parent: panelMeta,
            name: 'Textures',
            type: 'element',
            element: new ui.List()
        });
        fieldTextures.parent.class.add('field');
        fieldTextures.class.add('source-textures');
        fieldTextures.flexGrow = 1;
        fieldTextures.selectable = false;
        // no textures
        var fieldNoTextures = new ui.Label({
            text: 'no'
        });
        fieldNoTextures.class.add('no-data');
        fieldTextures.parent.appendBefore(fieldNoTextures, fieldTextures);
        // add all textures
        var addTextures = function(list) {
            fieldTextures.clear();
            for(var i = 0; i < list.length; i++) {
                var item = new ui.ListItem({
                    text: list[i].name
                });
                fieldTextures.append(item);
            }

            if (list.length) {
                fieldNoTextures.hidden = true;
                fieldTextures.hidden = false;
            } else {
                fieldTextures.hidden = true;
                fieldNoTextures.hidden = false;
            }
        };
        // already available
        var textures = asset.get('meta.textures');
        if (textures && textures.length) {
            addTextures(textures);
        } else {
            fieldTextures.hidden = true;
        }
        // might be set later
        events.push(asset.on('meta.textures:set', function() {
            addTextures(asset.get('meta.textures'));
        }));
        events.push(asset.on('meta.textures:unset', function() {
            fieldTextures.clear();
            fieldTextures.hidden = true;
            fieldNoTextures.hidden = false;
        }));


        // materials
        var fieldMaterials = editor.call('attributes:addField', {
            parent: panelMeta,
            name: 'Materials',
            type: 'element',
            element: new ui.List()
        });
        fieldMaterials.flexGrow = 1;
        fieldMaterials.selectable = false;
        // add all materials
        var addMaterials = function(list) {
            fieldMaterials.clear();
            for(var i = 0; i < list.length; i++) {
                var item = new ui.ListItem({
                    text: list[i].name
                });
                fieldMaterials.append(item);
            }
        };
        // already available
        var materials = asset.get('meta.materials');
        if (materials && materials.length)
            addMaterials(materials);
        // might be set/unset later
        events.push(asset.on('meta.materials:set', function(materials) {
            for(var i = 0; i < materials.length; i++)
                materials[i] = materials[i].json();

            addMaterials(materials);
        }));
        events.push(asset.on('meta.materials:unset', function() {
            fieldMaterials.clear();
        }));


        // clear up events
        panelContents.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
