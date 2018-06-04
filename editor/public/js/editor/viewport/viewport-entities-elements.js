editor.once('load', function() {
    'use strict';

    var events = [];

    editor.on('attributes:inspect[entity]', function(entities) {
        if (events.length)
            clear();

        for (var i = 0, len = entities.length; i < len; i++) {
            updateElementProperties(entities[i]);
            addEvents(entities[i]);
        }
    });

    var fixed = function (value) {
        return +value.toFixed(3);
    };

    // update entities stored properties with whatever the realtime element
    // has - that's because depending on the screen size an element might not have
    // the correct properties when inspected so make sure these are right
    var updateElementProperties = function (entity) {
        if (! entity.entity || ! entity.has('components.element')) return;

        var history = entity.history.enabled;
        var sync = entity.sync.enabled;
        // turn off history and syncing
        // this is only for the local user
        entity.history.enabled = false;
        entity.sync.enabled = false;
        var margin = entity.entity.element.margin.data;
        entity.set('components.element.margin', [margin[0], margin[1], margin[2], margin[3]]);
        var anchor = entity.entity.element.anchor.data;
        entity.set('components.element.anchor', [anchor[0], anchor[1], anchor[2], anchor[3]]);
        entity.set('components.element.width', entity.entity.element.width);
        entity.set('components.element.height', entity.entity.element.height);
        var pos = entity.entity.getLocalPosition().data;
        entity.set('position', [pos[0], pos[1], pos[2]]);
        entity.sync.enabled = sync;
        entity.history.enabled = history;
    };

    var addEvents = function (entity) {
        var setting = {
            pos: false,
            anchor: false,
            pivot: false,
            size: false,
            margin: false,
            text: false,
            autoWidth: false,
            autoHeight: false
        };

        events.push(entity.on('*:set', function (path, value, valueOld, remote) {
            if (remote || ! entity.entity || ! entity.has('components.element')) return;

            // position change
            if (/^position/.test(path)) {
                if (setting.position) return;

                setting.position = true;

                // timeout because if we do it in the handler
                // it won't get sent to C3 due to observer.silence
                setTimeout(function () {
                    if (!editor.call('entities:layout:isUnderControlOfLayoutGroup', entity)) {
                        var margin = entity.entity.element.margin.data;
                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        setting.margin = true;
                        entity.set('components.element.margin', [fixed(margin[0]), fixed(margin[1]), fixed(margin[2]), fixed(margin[3])]);
                        setting.margin = false;
                        entity.history.enabled = history;
                    }

                    setting.position = false;
                });
            }
            // anchor change
            else if (/^components.element.anchor/.test(path)) {
                if (setting.anchor) return;
                setting.anchor = true;

                setTimeout(function () {
                    var pos = entity.entity.getLocalPosition().data;
                    var width = entity.entity.element.width;
                    var height = entity.entity.element.height;

                    var history = entity.history.enabled;
                    entity.history.enabled = false;
                    setting.size = true;
                    entity.set('position', [fixed(pos[0]), fixed(pos[1]), fixed(pos[2])]);
                    entity.set('components.element.width', fixed(width));
                    entity.set('components.element.height', fixed(height));
                    setting.size = false;
                    entity.history.enabled = history;

                    setting.anchor = false;
                });
            }
            // pivot change
            else if (/^components.element.pivot/.test(path)) {
                if (setting.pivot) return;

                setting.pivot = true;

                setTimeout(function () {

                    var pos = entity.entity.getLocalPosition().data;
                    var margin = entity.entity.element.margin.data;

                    var history = entity.history.enabled;
                    entity.history.enabled = false;
                    setting.position = true;
                    setting.margin = true;
                    entity.set('position', [fixed(pos[0]), fixed(pos[1]), fixed(pos[2])]);
                    entity.set('components.element.margin', [fixed(margin[0]), fixed(margin[1]), fixed(margin[2]), fixed(margin[3])]);
                    setting.position = false;
                    setting.margin = false;
                    entity.history.enabled = history;

                    setting.pivot = false;
                });
            }
            // width / height change
            else if (/^components.element.(width|height)/.test(path)) {
                if (setting.size) return;

                setting.size = true;

                setTimeout(function () {
                    var margin = entity.entity.element.margin.data;

                    var history = entity.history.enabled;
                    entity.history.enabled = false;
                    setting.margin = true;
                    entity.set('components.element.margin', [fixed(margin[0]), fixed(margin[1]), fixed(margin[2]), fixed(margin[3])]);
                    setting.margin = false;
                    entity.history.enabled = history;

                    setting.size = false;
                });
            }
            // margin change
            else if (/^components.element.margin/.test(path)) {
                if (setting.margin) return;

                setting.margin = true;

                setTimeout(function () {
                    var pos = entity.entity.getLocalPosition().data;
                    var width = entity.entity.element.width;
                    var height = entity.entity.element.height;

                    var history = entity.history.enabled;
                    entity.history.enabled = false;
                    setting.position = true;
                    setting.size = true;
                    entity.set('position', [fixed(pos[0]), fixed(pos[1]), fixed(pos[2])]);
                    entity.set('components.element.width', fixed(width));
                    entity.set('components.element.height', fixed(height));
                    setting.size = false;
                    setting.position = false;
                    entity.history.enabled = history;

                    setting.margin = false;
                });
            }
            // autoWidth change
            else if (/^components.element.autoWidth/.test(path)) {
                if (setting.autoWidth) return;

                setting.autoWidth = true;
                setTimeout(function () {
                    var width = entity.entity.element.width;

                    var history = entity.history.enabled;
                    entity.history.enabled = false;
                    entity.set('components.element.width', fixed(width));
                    entity.history.enabled = history;
                    setting.autoWidth = false;
                });
            }
            // autoHeight change
            else if (/^components.element.autoHeight/.test(path)) {
                if (setting.autoHeight) return;

                setting.autoHeight = true;
                setTimeout(function () {
                    var height = entity.entity.element.height;

                    var history = entity.history.enabled;
                    entity.history.enabled = false;
                    entity.set('components.element.height', fixed(height));
                    entity.history.enabled = history;
                    setting.autoHeight = false;
                });
            }
            // text / font change
            else if (/^components.element.(text|fontAsset)/.test(path)) {
                if (setting.text) return;

                setting.text = true;
                if (entity.get('components.element.autoWidth') ||
                    entity.get('components.element.autoHeight')) {

                    setTimeout(function () {
                        var width = entity.entity.element.width;
                        var height = entity.entity.element.height;

                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        if (entity.get('components.element.autoWidth'))
                            entity.set('components.element.width', fixed(width));
                        if (entity.get('components.element.autoHeight'))
                            entity.set('components.element.height', fixed(height));
                        entity.history.enabled = history;

                        setting.text = false;
                    });

                }
            }
            // disabling a layout group
            else if (/^components.layoutgroup.enabled/.test(path)) {
                if (value === false && valueOld === true) {
                    editor.call('entities:layout:storeLayout', entity.get('children'));
                }
            }
            // excluding a layout child from the layout
            else if (/^components.layoutchild.excludeFromLayout/.test(path)) {
                if (value === true && valueOld === false) {
                    editor.call('entities:layout:storeLayout', [entity.entity.getGuid()]);
                }
            }
        }));

        // removing a layout group component
        events.push(entity.on('components.layoutgroup:unset', function () {
            setTimeout(function () {
                editor.call('entities:layout:storeLayout', entity.get('children'));
            });
        }));

        events.push(editor.on('gizmo:translate:end', function() {
            var translatedEntities = editor.call('selector:items');

            setTimeout(function () {
                var didReflow = false;

                // Trigger reflow if the user has moved an element that is under
                // the control of a layout group.
                for (var i = 0; i < translatedEntities.length; ++i) {
                    var entity = translatedEntities[i];

                    if (editor.call('entities:layout:isUnderControlOfLayoutGroup', entity)) {
                        editor.call('entities:layout:scheduleReflow', entity.get('parent'));
                        didReflow = true;
                    }
                }

                if (didReflow) {
                    setTimeout(function () {
                        // Ensure the reflowed positions are synced to other clients.
                        var parent = editor.call('entities:get', entity.get('parent'));
                        var siblings = parent.get('children');
                        editor.call('entities:layout:storeLayout', siblings);

                        // Trigger the translate gizmo to re-sync with the position of
                        // the selected elements, as they will likely have moved as a
                        // result of the reflow.
                        editor.emit('gizmo:translate:sync');
                    });
                }
            });
        }));
    };

    var clear = function () {
        for (var i = 0, len = events.length; i < len; i++)
            events[i].unbind();

        events.length = 0;
    };

    editor.on('attributes:clear', clear);

});
