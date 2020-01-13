editor.once('load', function() {
    'use strict';

    if (editor.call('users:hasFlag', 'hasPcuiComponentInspectors')) return;

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var app = editor.call('viewport:app');
        if (! app) return; // webgl not available


        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Animation',
            name: 'animation',
            entities: entities
        });

        // animation.assets
        var fieldAssets = editor.call('attributes:addAssetsList', {
            panel: panel,
            name: 'Assets',
            type: 'animation',
            link: entities,
            path: 'components.animation.assets',
            reference: 'animation:assets',
            canOverrideTemplate: true
        });

        var first = true;
        var initial = true;

        var onAssetAdd = function(item) {
            var btnPlay = new ui.Button();
            btnPlay.class.add('play');
            btnPlay.on('click', function(evt) {
                evt.stopPropagation();

                var id = parseInt(item.asset.get('id'), 10);

                for(var i = 0; i < entities.length; i++) {
                    if (! entities[i].entity || ! entities[i].entity.animation)
                        continue;

                    if (entities[i].entity.animation.assets.indexOf(id) === -1) {
                        entities[i].entity.animation._stopCurrentAnimation();
                        continue;
                    }

                    var name = entities[i].entity.animation.animationsIndex[id];
                    if (! name) continue;

                    entities[i].entity.animation.play(name);
                }
            });
            btnPlay.parent = item;
            item.element.appendChild(btnPlay.element);

            if (first || ! initial) {
                first = false;
                var id = item.asset.get('id');
                var asset = app.assets.get(id);

                var onAssetAdd = function(asset) {
                    if (asset.resource) {
                        editor.once('viewport:update', function() {
                            btnPlay.element.click();
                        });
                    } else {
                        asset.once('load', function() {
                            btnPlay.element.click();
                        });
                    }
                };

                if (asset) {
                    onAssetAdd(asset);
                } else {
                    app.assets.once('add:' + id, onAssetAdd);
                }
            }

            item.once('destroy', function() {
                var id = parseInt(item.asset.get('id'), 10);

                for(var i = 0; i < entities.length; i++) {
                    if (! entities[i].entity || ! entities[i].entity.animation || entities[i].entity.animation.assets.indexOf(id) === -1)
                        continue;

                    var name = entities[i].entity.animation.animationsIndex[id];
                    if (! name || entities[i].entity.animation.currAnim !== name)
                        continue;

                    entities[i].entity.animation._stopCurrentAnimation();
                }
            });
        };

        var nodes = fieldAssets.element.childNodes;
        for(var i = 0; i < nodes.length; i++) {
            if (! nodes[i].ui || ! nodes[i].ui.asset)
                continue;

            onAssetAdd(nodes[i].ui);
        }
        initial = false;

        if (first) {
            first = false;

            for(var i = 0; i < entities.length; i++) {
                if (! entities[i].entity || ! entities[i].entity.animation)
                    continue;

                entities[i].entity.animation._stopCurrentAnimation();
            }
        }

        fieldAssets.on('append', onAssetAdd);

        // animation.speed
        var fieldSpeed = editor.call('attributes:addField', {
            parent: panel,
            name: 'Speed',
            type: 'number',
            precision: 3,
            step: 0.1,
            link: entities,
            path: 'components.animation.speed',
            canOverrideTemplate: true
        });
        fieldSpeed.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'animation:speed', fieldSpeed.parent.innerElement.firstChild.ui);

        // intensity slider
        var fieldSpeedSlider = editor.call('attributes:addField', {
            panel: fieldSpeed.parent,
            precision: 3,
            step: 0.1,
            min: -2,
            max: 2,
            type: 'number',
            slider: true,
            link: entities,
            path: 'components.animation.speed'
        });
        fieldSpeedSlider.flexGrow = 4;


        // animation.playback
        var panelPlayback = new ui.Panel();
        panelPlayback.flex = true;
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Playback',
            type: 'element',
            element: panelPlayback
        });

        // animation.activate
        var fieldActivate = editor.call('attributes:addField', {
            panel: panelPlayback,
            type: 'checkbox',
            link: entities,
            path: 'components.animation.activate'
        });
        editor.call('attributes:registerOverridePath', 'components.animation.activate', fieldActivate.element);

        // label
        var label = new ui.Label({ text: 'Activate' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        panelPlayback.append(label);
        // reference activate
        editor.call('attributes:reference:attach', 'animation:activate', label);

        // animation.loop
        var fieldLoop = editor.call('attributes:addField', {
            panel: panelPlayback,
            type: 'checkbox',
            link: entities,
            path: 'components.animation.loop',
            canOverrideTemplate: true
        });
        editor.call('attributes:registerOverridePath', 'components.animation.loop', fieldLoop.element);

        // label
        var label = new ui.Label({ text: 'Loop' });
        label.class.add('label-infield');
        panelPlayback.append(label);
        // reference loop
        editor.call('attributes:reference:attach', 'animation:loop', label);
    });
});
