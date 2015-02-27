editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        // audiosource
        var panel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Audio Source'
        });
        panel.class.add('component');

        if (! entity.get('components.audiosource')) {
            panel.disabled = true;
            panel.hidden = true;
        }
        var evtComponentSet = entity.on('components.audiosource:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        });
        var evtComponentUnset = entity.on('components.audiosource:unset', function() {
            panel.disabled = true;
            panel.hidden = true;
        });
        panel.on('destroy', function() {
            evtComponentSet.unbind();
            evtComponentUnset.unbind();
        });


        // enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.class.add('component-toggle');
        fieldEnabled.link(entity, 'components.audiosource.enabled');
        panel.headerAppend(fieldEnabled);

        // remove
        var fieldRemove = new ui.Button();
        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function(value) {
            entity.unset('components.audiosource');
        });
        panel.headerAppend(fieldRemove);


        // assets
        var fieldAssetsList = new ui.List();
        fieldAssetsList.flexGrow = 1;

        var fieldAssets = editor.call('attributes:addField', {
            parent: panel,
            name: 'Assets',
            type: 'element',
            element: fieldAssetsList
        });
        fieldAssets.class.add('assets');

        // assets list
        var itemAdd = new ui.ListItem({
            text: 'Add Audio'
        });
        itemAdd.class.add('add-asset');
        fieldAssetsList.append(itemAdd);

        // add asset icon
        var iconAdd = document.createElement('span');
        iconAdd.classList.add('icon');
        itemAdd.element.appendChild(iconAdd);

        // index list items by asset id
        var audioAssetItems = { };

        // add asset
        var addAsset = function(assetId, after) {
            var assetAudio = editor.call('assets:get', assetId);
            var item = new ui.ListItem({
                text: (assetAudio && assetAudio.name) || assetId
            });

            if (after) {
                fieldAssetsList.appendAfter(item, after);
            } else {
                fieldAssetsList.append(item);
            }

            audioAssetItems[assetId] = item;

            // remove button
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            btnRemove.on('click', function() {
                entity.removeValue('components.audiosource.assets', assetId);
            });
            btnRemove.parent = item;
            item.element.appendChild(btnRemove.element);
        };

        // on adding new audio
        itemAdd.on('click', function() {
            // call picker
            editor.call('picker:asset', 'audio', null);

            // on pick
            var evtPick = editor.once('picker:asset', function(asset) {
                // already in list
                if (entity.get('components.audiosource.assets').indexOf(asset.get('id')) !== -1)
                    return;

                // add to component
                entity.insert('components.audiosource.assets', asset.get('id'), 0);
                evtPick = null;
            });

            editor.once('picker:asset:close', function() {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        });

        // audiosource.assets.list
        var assets = entity.get('components.audiosource.assets');
        if (assets) {
            for(var i = 0; i < assets.length; i++) {
                addAsset(assets[i]);
            }
        }
        // on asset insert
        var evtAssetInsert = entity.on('components.audiosource.assets:insert', function(assetId, ind) {
            var before;
            if (ind === 0) {
                before = itemAdd;
            } else {
                before = audioAssetItems[entity.get('components.audiosource.assets.' + ind)];
            }
            addAsset(assetId, before);
        });
        // on asset remove
        var evtAssetRemove = entity.on('components.audiosource.assets:remove', function(assetId) {
            if (! audioAssetItems[assetId])
                return;

            audioAssetItems[assetId].destroy();
        });


        // audiosource.playback
        var panelPlayback = new ui.Panel();
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Playback',
            type: 'element',
            element: panelPlayback
        });

        // audiosource.activate
        var fieldActivate = new ui.Checkbox();
        fieldActivate.link(entity, 'components.audiosource.activate');
        panelPlayback.append(fieldActivate);
        var label = new ui.Label({ text: 'Activate' });
        label.class.add('label-infield');
        panelPlayback.append(label);

        // audiosource.loop
        var fieldLoop = new ui.Checkbox();
        fieldLoop.link(entity, 'components.audiosource.loop');
        panelPlayback.append(fieldLoop);
        var label = new ui.Label({ text: 'Loop' });
        label.class.add('label-infield');
        panelPlayback.append(label);

        // audiosource.3d
        var fieldLoop = new ui.Checkbox();
        fieldLoop.link(entity, 'components.audiosource.3d');
        panelPlayback.append(fieldLoop);
        var label = new ui.Label({ text: '3D' });
        label.class.add('label-infield');
        panelPlayback.append(label);


        // volume
        var fieldVolume = editor.call('attributes:addField', {
            parent: panel,
            name: 'Volume',
            type: 'number',
            precision: 2,
            step: 0.01,
            min: 0,
            max: 1,
            link: entity,
            path: 'components.audiosource.volume'
        });
        fieldVolume.style.width = '32px';

        // volume slider
        var fieldVolumeSlider = new ui.Slider({
            min: 0,
            max: 1,
            precision: 3
        });
        fieldVolumeSlider.flexGrow = 4;
        fieldVolumeSlider.link(entity, 'components.audiosource.volume');
        fieldVolume.parent.append(fieldVolumeSlider);


        // pitch
        var fieldVolume = editor.call('attributes:addField', {
            parent: panel,
            name: 'Pitch',
            type: 'number',
            precision: 2,
            step: 0.1,
            min: 0,
            link: entity,
            path: 'components.audiosource.pitch'
        });


        // distance
        var panelDistance = editor.call('attributes:addField', {
            parent: panel,
            name: 'Distance'
        });

        var label = panelDistance;
        panelDistance = panelDistance.parent;
        label.destroy();

        // minDistance
        var fieldMinDistance = new ui.NumberField({
            precision: 2,
            step: 1,
            min: 0
        });
        fieldMinDistance.placeholder = 'Min';
        fieldMinDistance.style.width = '32px';
        fieldMinDistance.flexGrow = 1;
        fieldMinDistance.link(entity, 'components.audiosource.minDistance');
        panelDistance.append(fieldMinDistance);

        // maxDistance
        var fieldMaxDistance = new ui.NumberField({
            precision: 2,
            step: 1,
            min: 0
        });
        fieldMaxDistance.placeholder = 'Max';
        fieldMaxDistance.style.width = '32px';
        fieldMaxDistance.flexGrow = 1;
        fieldMaxDistance.link(entity, 'components.audiosource.maxDistance');
        panelDistance.append(fieldMaxDistance);


        // audiosource.rollOffFactor
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Roll-off factor',
            type: 'number',
            precision: 2,
            step: 0.1,
            min: 0,
            link: entity,
            path: 'components.audiosource.rollOffFactor'
        });
    });
});
