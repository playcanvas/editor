editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'scene' || ! assets[0].get('source'))
            return;

        var asset = assets[0];
        var events = [ ];

        // panel
        var panel = editor.call('attributes:addPanel');
        panel.class.add('component');

        // download
        var btnDownload = new ui.Button();
        btnDownload.text = 'Download';
        btnDownload.class.add('download-asset');
        btnDownload.element.addEventListener('click', function(evt) {
            window.open(asset.get('file.url'));
        }, false);
        panel.append(btnDownload);


        // contents
        var panelContents = editor.call('attributes:addPanel', {
            name: 'Contents'
        });
        panelContents.class.add('component');
        // reference
        editor.call('attributes:reference:asset:scene:contents:attach', panelContents, panelContents.headerElement);


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
            name: 'Animation',
            link: asset,
            path: 'meta.animation.available'
        });


        // textures
        var fieldTextures = editor.call('attributes:addField', {
            parent: panelMeta,
            name: 'Textures',
            type: 'element',
            element: new ui.List()
        })
        fieldTextures.flexGrow = 1;
        // add all textures
        var addTextures = function(list) {
            fieldTextures.clear();
            for(var i = 0; i < list.length; i++) {
                var item = new ui.ListItem({
                    text: list[i].name
                });
                fieldTextures.append(item);
            }
        };
        // already available
        var textures = asset.get('meta.textures');
        if (textures && textures.length)
            addTextures(textures);
        // might be set later
        events.push(asset.on('meta.textures:set', addTextures));
        events.push(asset.on('meta.textures:unset', function() {
            fieldTextures.clear();
        }));


        // materials
        var fieldMaterials = editor.call('attributes:addField', {
            parent: panelMeta,
            name: 'Materials',
            type: 'element',
            element: new ui.List()
        })
        fieldMaterials.flexGrow = 1;
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
        panel.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
