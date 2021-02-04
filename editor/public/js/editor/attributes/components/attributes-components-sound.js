editor.once('load', function () {
    'use strict';

    if (editor.call('users:hasFlag', 'hasPcuiComponentInspectors')) return;

    editor.on('attributes:inspect[entity]', function (entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Sound',
            name: 'sound',
            entities: entities
        });

        // positional
        var fieldPositional = editor.call('attributes:addField', {
            parent: panel,
            type: 'checkbox',
            name: 'Positional',
            link: entities,
            path: 'components.sound.positional',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'sound:positional', fieldPositional.parent.innerElement.firstChild.ui);

        fieldPositional.on('change', function (value) {
            panelDistance.hidden = fieldDistanceModel.parent.hidden = fieldRollOffFactor.parent.hidden = ! (fieldPositional.value || fieldPositional.class.contains('null'));
        });

        // volume
        var fieldVolume = editor.call('attributes:addField', {
            parent: panel,
            name: 'Volume',
            type: 'number',
            precision: 2,
            step: 0.01,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.sound.volume',
            canOverrideTemplate: true
        });
        fieldVolume.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'sound:volume', fieldVolume.parent.innerElement.firstChild.ui);

        // volume slider
        var fieldVolumeSlider = editor.call('attributes:addField', {
            panel: fieldVolume.parent,
            precision: 2,
            step: 0.01,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: entities,
            path: 'components.sound.volume'
        });
        fieldVolumeSlider.flexGrow = 4;

        // pitch
        var fieldPitch = editor.call('attributes:addField', {
            parent: panel,
            name: 'Pitch',
            type: 'number',
            precision: 2,
            step: 0.1,
            min: 0,
            link: entities,
            path: 'components.sound.pitch',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'sound:pitch', fieldPitch.parent.innerElement.firstChild.ui);


        // distance
        var panelDistance = editor.call('attributes:addField', {
            parent: panel,
            name: 'Distance'
        });
        var label = panelDistance;
        panelDistance = panelDistance.parent;
        label.destroy();
        panelDistance.hidden = ! (fieldPositional.value || fieldPositional.class.contains('null'));

        // reference
        editor.call('attributes:reference:attach', 'sound:distance', panelDistance.innerElement.firstChild.ui);

        // refDistance
        var fieldRefDistance = editor.call('attributes:addField', {
            panel: panelDistance,
            placeholder: 'Ref',
            type: 'number',
            precision: 2,
            step: 1,
            min: 0,
            link: entities,
            path: 'components.sound.refDistance'
        });
        fieldRefDistance.style.width = '32px';
        fieldRefDistance.flexGrow = 1;

        editor.call('attributes:registerOverridePath', 'components.sound.refDistance', fieldRefDistance.element);

        // maxDistance
        var fieldMaxDistance = editor.call('attributes:addField', {
            panel: panelDistance,
            placeholder: 'Max',
            type: 'number',
            precision: 2,
            step: 1,
            min: 0,
            link: entities,
            path: 'components.sound.maxDistance'
        });
        fieldRefDistance.style.width = '32px';
        fieldRefDistance.flexGrow = 1;

        editor.call('attributes:registerOverridePath', 'components.sound.maxDistance', fieldMaxDistance.element);

        // distanceModel
        var fieldDistanceModel = editor.call('attributes:addField', {
            parent: panel,
            name: 'Distance Model',
            type: 'string',
            enum: {
                linear: 'Linear',
                exponential: 'Exponential',
                inverse: 'Inverse'
            },
            link: entities,
            path: 'components.sound.distanceModel',
            canOverrideTemplate: true
        });

        fieldDistanceModel.parent.hidden = ! (fieldPositional.value || fieldPositional.class.contains('null'));

        // reference
        editor.call('attributes:reference:attach', 'sound:distanceModel', fieldDistanceModel.parent.innerElement.firstChild.ui);

        // rollOffFactor
        var fieldRollOffFactor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Roll-off factor',
            type: 'number',
            precision: 2,
            step: 0.1,
            min: 0,
            link: entities,
            path: 'components.sound.rollOffFactor',
            canOverrideTemplate: true
        });
        fieldRollOffFactor.parent.hidden = ! (fieldPositional.value || fieldPositional.class.contains('null'));

        // reference
        editor.call('attributes:reference:attach', 'sound:rollOffFactor', fieldRollOffFactor.parent.innerElement.firstChild.ui);

        // show something when multiple entities are enabled for slots
        if (entities.length > 1) {
            editor.call('attributes:addField', {
                parent: panel,
                name: 'Slots',
                value: '...'
            });
        }

        // slots
        var panelSlots = new ui.Panel();
        panelSlots.class.add('sound-slots');
        panel.append(panelSlots);
        panelSlots.hidden = (entities.length > 1);

        // Create UI for each slot
        var createSlot = function (key, slot, focus) {
            // slot panel
            var panelSlot = new ui.Panel(slot.name || 'New Slot' );
            panelSlot.class.add('sound-slot');
            panelSlot.element.id = 'sound-slot-' + key;
            panelSlot.foldable = true;
            panelSlot.folded = false;
            panelSlots.append(panelSlot);

            editor.call('attributes:registerOverridePath', 'components.sound.slots.' + key, panelSlot.element);

            // reference
            editor.call('attributes:reference:attach', 'sound:slot:slot', panelSlot, panelSlot.headerElementTitle);

            // button to remove slot
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panelSlot.headerElement.appendChild(btnRemove.element);
            btnRemove.on('click', function () {
                entities[0].unset('components.sound.slots.' + key);
            });

            // slot name
            var fieldSlotName = editor.call('attributes:addField', {
                parent: panelSlot,
                name: 'Name',
                type: 'string'
            });

            editor.call('attributes:registerOverridePath', 'components.sound.slots.' + key + '.name', fieldSlotName.parent.element);

            // reference
            editor.call('attributes:reference:attach', 'sound:slot:name', fieldSlotName.parent.innerElement.firstChild.ui);

            // set initial value
            fieldSlotName.value = slot.name;

            var suspendKeyUp = false;
            fieldSlotName.elementInput.addEventListener('keyup', function (e) {
                if (suspendKeyUp) return;

                // if the name already exists show error
                var error = false;
                var value = fieldSlotName.value;
                for (var k in slots) {
                    if (k === key) continue;

                    if (slots[k].name === value) {
                        fieldSlotName.class.add('error');
                        return;
                    }
                }

                // no error so make the field go back to normal
                fieldSlotName.class.remove('error');
            });

            var suspend = false;
            // manually change entity on change event
            fieldSlotName.on('change', function (value) {
                // change header to new name
                panelSlot.header = value || 'New Slot';

                if (suspend) return;

                var prevValue = entities[0].get('components.sound.slots.' + key + '.name');
                var slots = entities[0].get('components.sound.slots');
                for (var k in slots) {

                    // revert slot name to previous value
                    if (slots[k].name === value) {
                        suspend = true;
                        suspendKeyUp = true;
                        fieldSlotName.value = prevValue;
                        fieldSlotName.class.remove('error');
                        suspendKeyUp = false;
                        suspend = false;
                        return;
                    }
                }

                entities[0].set('components.sound.slots.' + key + '.name', value);
            });

            // unbind events
            var evtChange = entities[0].on('components.sound.slots.' + key + '.name:set', function (value) {
                suspend = true;
                fieldSlotName.value = value;
                suspend = false;
            });

            var evtUnset = entities[0].on('components.sound.slots.' + key + ':unset', function () {
                if (evtChange) {
                    evtChange.unbind();
                    evtChange = null;
                }

                if (evtUnset) {
                    evtUnset.unbind();
                    evtUnset.unbind();
                }
            });

            panel.on('destroy', function () {
                if (evtChange) {
                    evtChange.unbind();
                    evtChange = null;
                }

                if (evtUnset) {
                    evtUnset.unbind();
                    evtUnset.unbind();
                }
            });

            var fieldSlotAsset = editor.call('attributes:addField', {
                parent: panelSlot,
                name: 'Asset',
                type: 'asset',
                kind: 'audio',
                link: entities,
                path: 'components.sound.slots.' + key + '.asset',
                canOverrideTemplate: true
            });

            // reference
            editor.call('attributes:reference:attach', 'sound:slot:asset', fieldSlotAsset._label);

            // range
            var panelRange = editor.call('attributes:addField', {
                parent: panelSlot,
                name: 'Range'
            });
            var label = panelRange;
            panelRange = panelRange.parent;
            label.destroy();

            // startTime
            var fieldSlotStartTime = editor.call('attributes:addField', {
                panel: panelRange,
                placeholder: 'Start',
                type: 'number',
                precision: 2,
                step: 0.01,
                min: 0,
                link: entities,
                path: 'components.sound.slots.' + key + '.startTime'
            });
            fieldSlotStartTime.style.width = '32px';
            fieldSlotStartTime.flexGrow = 1;

            editor.call('attributes:registerOverridePath', 'components.sound.slots.' + key + '.startTime', fieldSlotStartTime.element);

            // reference
            editor.call('attributes:reference:attach', 'sound:slot:startTime', fieldSlotStartTime);

            // duration
            var fieldSlotDuration = editor.call('attributes:addField', {
                panel: panelRange,
                placeholder: 'Duration',
                type: 'number',
                precision: 2,
                step: 0.01,
                min: 0,
                link: entities,
                path: 'components.sound.slots.' + key + '.duration'
            });
            fieldSlotDuration.style.width = '32px';
            fieldSlotDuration.flexGrow = 1;

            editor.call('attributes:registerOverridePath', 'components.sound.slots.' + key + '.duration', fieldSlotDuration.element);

            // reference
            editor.call('attributes:reference:attach', 'sound:slot:duration', fieldSlotDuration);

            // playback
            var panelPlayback = editor.call('attributes:addField', {
                parent: panelSlot,
                name: 'Playback'
            });
            label = panelPlayback;
            panelPlayback = panelPlayback.parent;
            label.destroy();

            var fieldSlotAutoPlay = editor.call('attributes:addField', {
                panel: panelPlayback,
                type: 'checkbox',
                link: entities,
                path: 'components.sound.slots.' + key + '.autoPlay'
            });
            // label
            label = new ui.Label({ text: 'Auto Play' });
            label.class.add('label-infield');
            panelPlayback.append(label);

            editor.call('attributes:registerOverridePath', 'components.sound.slots.' + key + '.autoPlay', fieldSlotAutoPlay.element);

            // reference
            editor.call('attributes:reference:attach', 'sound:slot:autoPlay', label);

            var fieldSlotOverlap = editor.call('attributes:addField', {
                panel: panelPlayback,
                type: 'checkbox',
                link: entities,
                path: 'components.sound.slots.' + key + '.overlap'
            });
            // label
            label = new ui.Label({ text: 'Overlap' });
            label.class.add('label-infield');
            panelPlayback.append(label);

            editor.call('attributes:registerOverridePath', 'components.sound.slots.' + key + '.overlap', fieldSlotOverlap.element);

            // reference
            editor.call('attributes:reference:attach', 'sound:slot:overlap', label);

            var fieldSlotLoop = editor.call('attributes:addField', {
                panel: panelPlayback,
                type: 'checkbox',
                link: entities,
                path: 'components.sound.slots.' + key + '.loop'
            });
            // label
            label = new ui.Label({ text: 'Loop' });
            label.class.add('label-infield');
            panelPlayback.append(label);

            editor.call('attributes:registerOverridePath', 'components.sound.slots.' + key + '.loop', fieldSlotLoop.element);

            // reference
            editor.call('attributes:reference:attach', 'sound:slot:loop', label);

            // slot volume
            var fieldSlotVolume = editor.call('attributes:addField', {
                parent: panelSlot,
                name: 'Volume',
                type: 'number',
                precision: 2,
                step: 0.01,
                min: 0,
                max: 1,
                link: entities,
                path: 'components.sound.slots.' + key + '.volume',
                canOverrideTemplate: true
            });

            // reference
            editor.call('attributes:reference:attach', 'sound:slot:volume', fieldSlotVolume.parent.innerElement.firstChild.ui);

            // volume slider
            var fieldSlotVolumeSlider = editor.call('attributes:addField', {
                panel: fieldSlotVolume.parent,
                precision: 2,
                step: 0.01,
                min: 0,
                max: 1,
                type: 'number',
                slider: true,
                link: entities,
                path: 'components.sound.slots.' + key + '.volume'
            });
            fieldSlotVolume.style.width = '32px';
            fieldSlotVolumeSlider.flexGrow = 4;

            // slot pitch
            var fieldSlotPitch = editor.call('attributes:addField', {
                parent: panelSlot,
                name: 'Pitch',
                type: 'number',
                precision: 2,
                step: 0.1,
                min: 0,
                link: entities,
                path: 'components.sound.slots.' + key + '.pitch',
                canOverrideTemplate: true
            });

            // reference
            editor.call('attributes:reference:attach', 'sound:slot:pitch', fieldSlotPitch.parent.innerElement.firstChild.ui);

            if (focus) {
                fieldSlotName.elementInput.focus();
                fieldSlotName.elementInput.select();
            }
        };

        // create slot button
        var btnCreateSlot = new ui.Button({
            text: 'Add Slot'
        });
        btnCreateSlot.class.add('add-sound-slot');
        btnCreateSlot.hidden = entities.length > 1;
        panel.append(btnCreateSlot);

        btnCreateSlot.on('click', function () {
            var keyName = 1;
            var count = 0;
            var idx = {};
            slots = entities[0].get('components.sound.slots');
            for (var key in slots) {
                keyName = parseInt(key, 10);
                idx[slots[key].name] = true;
                count++;
            }

            keyName += 1;
            name = 'Slot ' + (count + 1);
            while (idx[name]) {
                count++;
                name = 'Slot ' + (count + 1);
            }

            entities[0].set('components.sound.slots.' + (keyName), {
                name: name,
                loop: false,
                autoPlay: false,
                overlap: false,
                asset: null,
                startTime: 0,
                duration: null,
                volume: 1,
                pitch: 1
            });
        });

        // create slots for first entity only
        var slots = entities[0].get('components.sound.slots');
        for (var key in slots) {
            createSlot(key, slots[key]);
        }

        // add event for new slots
        var evtAddSlot = entities[0].on('*:set', function (path, value) {
            var matches = path.match(/^components.sound.slots.(\d+)$/);
            if (! matches) return;

            createSlot(matches[1], value, true);
        });

        // add event for deletings slots
        var evtRemoveSlot = entities[0].on('*:unset', function (path, value) {
            var matches = path.match(/^components.sound.slots.(\d+)$/);
            if (! matches) return;

            var slotPanel = document.getElementById('sound-slot-' + matches[1]);
            if (slotPanel) {
                slotPanel.parentElement.removeChild(slotPanel);
            }
        });

        panel.on('destroy', function () {
            if (evtAddSlot)
                evtAddSlot.unbind();

            if (evtRemoveSlot)
                evtRemoveSlot.unbind();
        });
    });
});
