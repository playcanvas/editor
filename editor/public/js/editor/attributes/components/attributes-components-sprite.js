editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var events = [ ];

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Sprite',
            name: 'sprite',
            entities: entities
        });

        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'string',
            enum: [
                {v: '', t: '...'},
                {v: 'simple', t: 'Simple'},
                {v: 'animated', t: 'Animated'}
            ],
            link: entities,
            path: 'components.sprite.type'
        });

        // reference
        editor.call('attributes:reference:attach', 'sprite:type', fieldType.parent.innerElement.firstChild.ui);


        var fieldColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Color',
            type: 'rgb',
            channels: 4,
            link: entities,
            path: 'components.sprite.color'
        });

        // reference
        editor.call('attributes:reference:attach', 'sprite:color', fieldColor.parent.innerElement.firstChild.ui);

        var fieldOpacity = editor.call('attributes:addField', {
            parent: panel,
            name: 'Opacity',
            type: 'number',
            min: 0,
            max: 1,
            link: entities,
            path: 'components.sprite.opacity'
        });

        fieldOpacity.style.width = '32px';

        // reference
        editor.call('attributes:reference:attach', 'sprite:opacity', fieldOpacity.parent.innerElement.firstChild.ui);

        var fieldOpacitySlider = editor.call('attributes:addField', {
            panel: fieldOpacity.parent,
            precision: 3,
            step: 1,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: entities,
            path: 'components.sprite.opacity'
        });
        fieldOpacitySlider.flexGrow = 4;

        var fieldSpriteAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Sprite',
            type: 'asset',
            kind: 'sprite',
            link: entities,
            path: 'components.sprite.spriteAsset'
        });

        // reference
        editor.call('attributes:reference:attach', 'sprite:spriteAsset', fieldSpriteAsset.parent.innerElement.firstChild.ui);


        var fieldFrame = editor.call('attributes:addField', {
            parent: panel,
            name: 'Frame',
            type: 'number',
            link: entities,
            min: 0,
            path: 'components.sprite.frame'
        });

        // reference
        editor.call('attributes:reference:attach', 'sprite:frame', fieldFrame.parent.innerElement.firstChild.ui);

        panel.on('destroy', function () {
            events.forEach(function (e) {
                e.unbind();
            });
            events.length = 0;
        });

        // clips
        var panelClips = new ui.Panel();
        panelClips.class.add('clips');
        panel.append(panelClips);

        var createClipPanel = function (clipName) {
            var panelClip = new ui.Panel(clipName);
            panelClip.class.add('clip');
            panelClip.foldable = true;
            panelClip.folded = false;
            panelClips.append(panelClip);

            // remove clip button
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panelClip.headerElement.appendChild(btnRemove.element);
            btnRemove.on('click', function () {
                // TODO: remove clip
            });

            var fieldClipName = editor.call('attributes:addField', {
                parent: panelClip,
                name: 'Name',
                type: 'string',
                link: entities,
                path: 'components.sprite.clips.' + clipName + '.name'
            }) ;
        };

        // gather all clip names and their count
        var numEntities = entities.length;
        var clipNames = {};
        for (var i = 0; i < numEntities; i++) {
            var clips = entities[i].get('components.sprite.clips');
            if (! clips) continue;

            for (var name in clips) {
                if (! clipNames[name])
                    clipNames[name] = 0;

                clipNames[name]++;
            }
        }

        // show all clips that are common between all selected entities
        for (var name in clipNames) {
            if (clipNames[name] !== numEntities) continue;

            createClipPanel(name);
        }


        // add clip button
        var btnAddClip = new ui.Button({
            text: 'Add Clip'
        });
        btnAddClip.class.add('add-clip');
        panel.append(btnAddClip);

        btnAddClip.on('click', function () {
            var count = 1;
            var desiredName = 'Clip ' + count;
            while (clipNames[desiredName]) {
                count++;
                desiredName = 'Clip ' + count;
            }

            var redo = function () {
                for (var i = 0; i < numEntities; i++) {
                    var entity = editor.call('entities:get', entities[i].get('resource_id'));
                    if (! entity) continue;
                    var history = entity.history.enabled;
                    entity.history.enabled = false;
                    entity.set('components.sprite.clips.' + desiredName, {
                        name: desiredName,
                        fps: 30,
                        loop: true,
                        spriteAsset: null
                    });
                    entity.history.enabled = history;
                }
            };

            var undo = function () {
                for (var i = 0; i < numEntities; i++) {
                    var entity = editor.call('entities:get', entities[i].get('resource_id'));
                    if (! entity) continue;
                    var history = entity.history.enabled;
                    entity.history.enabled = false;
                    entity.unset('components.sprite.clips.' + desiredName);
                    entity.history.enabled = history;
                }
            };

            editor.call('history:add', {
                name: 'entities.' + (numEntities > 1 ? '*' : entities[0].get('resource_id')) + '.components.sprite.clips.' + desiredName,
                undo: undo,
                redo: redo
            });

            redo();
        });

        // show / hide animated sprite fields
        var toggleFields = function () {
            var hideAnimated = false;

            for (var i = 0; i < numEntities; i++) {
                if (entities[i].get('components.sprite.type') !== 'animated') {
                    hideAnimated = true;
                    break;
                }
            }

            panelClips.hidden = hideAnimated;
            btnAddClip.hidden = hideAnimated;
            fieldFrame.parent.hidden = !hideAnimated;
            fieldSpriteAsset.parent.hidden = !hideAnimated;
        };

        fieldType.on('change', toggleFields);

        toggleFields();

    });
});
