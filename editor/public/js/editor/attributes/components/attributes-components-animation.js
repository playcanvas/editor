editor.once('load', function() {
    'use strict';


    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        // animation
        var panel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Animation'
        });
        panel.class.add('component', 'entity', 'animation');
        // reference
        editor.call('attributes:reference:animation:attach', panel, panel.headerElementTitle);

        if (! entity.get('components.animation')) {
            panel.disabled = true;
            panel.hidden = true;
        }
        var evtComponentSet = entity.on('components.animation:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        });
        var evtComponentUnset = entity.on('components.animation:unset', function() {
            panel.disabled = true;
            panel.hidden = true;
        });
        panel.on('destroy', function() {
            evtComponentSet.unbind();
            evtComponentUnset.unbind();
        });


        // remove
        var fieldRemove = new ui.Button();
        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function(value) {
            entity.unset('components.animation');
        });
        panel.headerAppend(fieldRemove);

        // enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.class.add('component-toggle');
        fieldEnabled.link(entity, 'components.animation.enabled');
        panel.headerAppend(fieldEnabled);

        // toggle-label
        var labelEnabled = new ui.Label();
        labelEnabled.renderChanges = false;
        labelEnabled.class.add('component-toggle-label');
        panel.headerAppend(labelEnabled);
        labelEnabled.text = fieldEnabled.value ? 'On' : 'Off';
        fieldEnabled.on('change', function(value) {
            labelEnabled.text = value ? 'On' : 'Off';
        });


        // animation.assets
        var fieldAssetsList = new ui.List();
        fieldAssetsList.flexGrow = 1;

        // drop
        var dropRef = editor.call('drop:target', {
            ref: fieldAssetsList.element,
            type: 'asset.animation',
            filter: function(type, data) {
                return type === 'asset.animation' && entity.get('components.animation.assets').indexOf(data.id) === -1;
            },
            drop: function(type, data) {
                if (type !== 'asset.animation')
                    return;

                // already in list
                if (entity.get('components.animation.assets').indexOf(data.id) !== -1)
                    return;

                // add to component
                entity.insert('components.animation.assets', data.id, 0);
            }
        });
        dropRef.disabled = ! entity.has('components.animation');
        var evtDropRefSet = entity.on('components.animation:set', function(value) {
            dropRef.disabled = false;
        });
        var evtDropRefUnset = entity.on('components.animation:unset', function(value) {
            dropRef.disabled = true;

            // clear list item
            var items = fieldAssetsList.element.children;
            var i = items.length;
            while(i-- > 1) {
                if (! items[i].ui || ! (items[i].ui instanceof ui.ListItem))
                    continue;

                items[i].ui.destroy();
            }
        });
        fieldAssetsList.on('destroy', function() {
            dropRef.unregister();
            evtDropRefSet.unbind();
            evtDropRefUnset.unbind();
        });

        var fieldAssets = editor.call('attributes:addField', {
            parent: panel,
            name: 'Assets',
            type: 'element',
            element: fieldAssetsList
        });
        fieldAssets.class.add('assets');

        // reference assets
        editor.call('attributes:reference:animation:assets:attach', fieldAssets.parent.innerElement.firstChild.ui);

        // assets list
        var itemAdd = new ui.ListItem({
            text: 'Add Animation'
        });
        itemAdd.class.add('add-asset');
        fieldAssetsList.append(itemAdd);

        // add asset icon
        var iconAdd = document.createElement('span');
        iconAdd.classList.add('icon');
        itemAdd.element.appendChild(iconAdd);

        // index list items by asset id
        var animationAssetItems = { };

        // add asset
        var addAsset = function(assetId, after) {
            var assetAnimation = editor.call('assets:get', assetId);
            var text = assetId;
            if (assetAnimation && assetAnimation.get('name'))
                text = assetAnimation.get('name');

            var item = new ui.ListItem({
                text: text
            });

            if (after) {
                fieldAssetsList.appendAfter(item, after);
            } else {
                fieldAssetsList.append(item);
            }

            animationAssetItems[assetId] = item;

            // remove button
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            btnRemove.on('click', function() {
                entity.removeValue('components.animation.assets', assetId);
            });
            btnRemove.parent = item;
            item.element.appendChild(btnRemove.element);
        };

        // on adding new animation
        itemAdd.on('click', function() {
            // call picker
            editor.call('picker:asset', 'animation', null);

            // on pick
            var evtPick = editor.once('picker:asset', function(asset) {
                // already in list
                if (entity.get('components.animation.assets').indexOf(asset.get('id')) !== -1)
                    return;

                // add to component
                entity.insert('components.animation.assets', asset.get('id'), 0);
                evtPick = null;
            });

            editor.once('picker:asset:close', function() {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        });

        // animation.assets.list
        var assets = entity.get('components.animation.assets');
        if (assets) {
            for(var i = 0; i < assets.length; i++) {
                addAsset(assets[i]);
            }
        }
        // on asset insert
        var evtAssetInsert = entity.on('components.animation.assets:insert', function(assetId, ind) {
            var before;
            if (ind === 0) {
                before = itemAdd;
            } else {
                before = animationAssetItems[entity.get('components.animation.assets.' + ind)];
            }
            addAsset(assetId, before);
        });
        // on asset remove
        var evtAssetRemove = entity.on('components.animation.assets:remove', function(assetId) {
            if (! animationAssetItems[assetId])
                return;

            animationAssetItems[assetId].destroy();
        });

        // clear events
        fieldAssetsList.once('destroy', function() {
            evtAssetInsert.unbind();
            evtAssetRemove.unbind();
        });

        // animation.speed
        var fieldSpeed = editor.call('attributes:addField', {
            parent: panel,
            name: 'Speed',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: entity,
            path: 'components.animation.speed'
        });

        // reference speed
        editor.call('attributes:reference:animation:speed:attach', fieldSpeed.parent.innerElement.firstChild.ui);

        // animation.playback
        var panelPlayback = new ui.Panel();
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Playback',
            type: 'element',
            element: panelPlayback
        });

        // animation.activate
        var fieldActivate = new ui.Checkbox();
        fieldActivate.link(entity, 'components.animation.activate');
        panelPlayback.append(fieldActivate);
        // label
        var label = new ui.Label({ text: 'Activate' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        panelPlayback.append(label);
        // reference activate
        editor.call('attributes:reference:animation:activate:attach', label);

        // animation.loop
        var fieldLoop = new ui.Checkbox();
        fieldLoop.link(entity, 'components.animation.loop');
        panelPlayback.append(fieldLoop);
        // label
        var label = new ui.Label({ text: 'Loop' });
        label.class.add('label-infield');
        panelPlayback.append(label);
        // reference loop
        editor.call('attributes:reference:animation:loop:attach', label);
    });
});
