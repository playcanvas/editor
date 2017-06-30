editor.once('load', function() {
    'use strict';

    var events = [];

    editor.on('attributes:inspect[entity]', function(entities) {
        if (events.length)
            clear();

        for (var i = 0, len = entities.length; i < len; i++) {
            addEvents(entities[i]);
        }
    });

    var fixed = function (value) {
        return +value.toFixed(3);
    };

    var addEvents = function (entity) {
        var setting = {
            pos: false,
            anchor: false,
            pivot: false,
            size: false,
            margin: false
        };

        events.push(entity.on('*:set', function (path) {
            if (! entity.entity || ! entity.has('components.element')) return;

            // position change
            if (/^position/.test(path)) {
                if (setting.position) return;

                setting.position = true;

                // timeout because if we do it in the handler
                // it won't get sent to C3 due to observer.silence
                setTimeout(function () {
                    var margin = entity.entity.element.margin.data;
                    var history = entity.history.enabled;
                    entity.history.enabled = false;
                    setting.margin = true;
                    entity.set('components.element.margin', [fixed(margin[0]), fixed(margin[1]), fixed(margin[2]), fixed(margin[3])]);
                    setting.margin = false;
                    entity.history.enabled = history;

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
                    setting.position = true;
                    setting.size = true;
                    entity.set('position', [fixed(pos[0]), fixed(pos[1]), fixed(pos[2])]);
                    entity.set('components.element.width', fixed(width));
                    entity.set('components.element.height', fixed(height));
                    setting.position = false;
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
        }));
    };

    var clear = function () {
        for (var i = 0, len = events.length; i < len; i++)
            events[i].unbind();

        events.length = 0;
    };

    editor.on('attributes:clear', clear);

});
