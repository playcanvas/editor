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


        // enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.parent = panel;
        fieldEnabled.style.float = 'left';
        fieldEnabled.style.backgroundColor = '#323f42';
        fieldEnabled.style.margin = '3px 4px 3px -5px';
        fieldEnabled.link(entity, 'components.animation.enabled');
        panel.headerElement.appendChild(fieldEnabled.element);

        // remove
        var fieldRemove = new ui.Checkbox();
        fieldRemove.parent = panel;
        fieldRemove.style.float = 'right';
        fieldRemove.style.backgroundColor = '#323f42';
        fieldRemove.style.margin = '3px 4px 3px -5px';
        fieldRemove.on('change', function (value) {
            if (value) {
                entity.unset('components.animation');
                fieldRemove.value = false;
            }
        });
        panel.headerElement.appendChild(fieldRemove.element);

        // animation.assets
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
            var item = new ui.ListItem({
                text: (assetAnimation && assetAnimation.name) || assetId
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
                entity.remove('components.animation.assets', assetId);
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
                if (entity.components.animation.assets.indexOf(asset.id) !== -1)
                    return;

                // add to component
                entity.insert('components.animation.assets', asset.id, 0);
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
        label.style.verticalAlign = 'top';
        label.style.paddingRight = '12px';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelPlayback.append(label);

        // animation.loop
        var fieldLoop = new ui.Checkbox();
        fieldLoop.link(entity, 'components.animation.loop');
        panelPlayback.append(fieldLoop);
        // label
        var label = new ui.Label({ text: 'Loop' });
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelPlayback.append(label);
    });
});
