import { ORIENTATION_HORIZONTAL, ORIENTATION_VERTICAL } from '../../core/constants.ts';

editor.once('load', () => {
    const events = [];

    editor.on('attributes:inspect[entity]', (entities) => {
        if (events.length) {
            clear();
        }

        for (let i = 0, len = entities.length; i < len; i++) {
            updateElementProperties(entities[i]);
            addEvents(entities[i]);
        }
    });

    const fixed = function (value) {
        return +value.toFixed(3);
    };

    // update entities stored properties with whatever the realtime element
    // has - that's because depending on the screen size an element might not have
    // the correct properties when inspected so make sure these are right
    var updateElementProperties = function (entity) {
        if (!entity.entity || !entity.has('components.element')) {
            return;
        }

        const history = entity.history.enabled;
        const sync = entity.sync.enabled;
        // turn off history and syncing
        // this is only for the local user
        entity.history.enabled = false;
        entity.sync.enabled = false;
        const margin = entity.entity.element.margin;
        entity.set('components.element.margin', [margin.x, margin.y, margin.z, margin.w]);
        const anchor = entity.entity.element.anchor;
        entity.set('components.element.anchor', [anchor.x, anchor.y, anchor.z, anchor.w]);
        entity.set('components.element.width', entity.entity.element.width);
        entity.set('components.element.height', entity.entity.element.height);
        const pos = entity.entity.getLocalPosition();
        entity.set('position', [pos.x, pos.y, pos.z]);
        entity.sync.enabled = sync;
        entity.history.enabled = history;
    };

    const applyProperties = function (entity, pathPrefix, properties) {
        Object.keys(properties).forEach((key) => {
            const value = properties[key];
            const path = `${pathPrefix}.${key}`;
            const prevHistory = entity.history.enabled;

            entity.history.enabled = false;
            entity.set(path, value, undefined, undefined, true);
            entity.history.enabled = prevHistory;
        });
    };

    var addEvents = function (entity) {
        const setting = {
            pos: false,
            anchor: false,
            pivot: false,
            size: false,
            margin: false,
            text: false,
            autoWidth: false,
            autoHeight: false
        };

        events.push(entity.on('*:set', (path, value, valueOld, remote) => {
            if (remote || !entity.entity || !entity.has('components.element')) {
                return;
            }

            // position change
            if (/^position/.test(path)) {
                if (setting.position) {
                    return;
                }

                setting.position = true;

                // timeout because if we do it in the handler
                // it won't get sent to C3 due to observer.silence
                setTimeout(() => {
                    if (!editor.call('entities:layout:isUnderControlOfLayoutGroup', entity)) {
                        const margin = entity.entity.element.margin;
                        const history = entity.history.enabled;
                        entity.history.enabled = false;
                        setting.margin = true;
                        entity.set('components.element.margin', [fixed(margin.x), fixed(margin.y), fixed(margin.z), fixed(margin.w)]);
                        setting.margin = false;
                        entity.history.enabled = history;
                    }

                    setting.position = false;
                });
            } else if (/^components.element.anchor/.test(path)) {
                // anchor change

                if (setting.anchor) {
                    return;
                }
                setting.anchor = true;

                setTimeout(() => {
                    const pos = entity.entity.getLocalPosition();
                    const width = entity.entity.element.width;
                    const height = entity.entity.element.height;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    setting.size = true;
                    entity.set('position', [fixed(pos.x), fixed(pos.y), fixed(pos.z)]);
                    entity.set('components.element.width', fixed(width));
                    entity.set('components.element.height', fixed(height));
                    setting.size = false;
                    entity.history.enabled = history;

                    setting.anchor = false;
                });
            } else if (/^components.element.pivot/.test(path)) {
                // pivot change

                if (setting.pivot) {
                    return;
                }

                setting.pivot = true;

                setTimeout(() => {

                    const pos = entity.entity.getLocalPosition();
                    const margin = entity.entity.element.margin;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    setting.position = true;
                    setting.margin = true;
                    entity.set('position', [fixed(pos.x), fixed(pos.y), fixed(pos.z)]);
                    entity.set('components.element.margin', [fixed(margin.x), fixed(margin.y), fixed(margin.z), fixed(margin.w)]);
                    setting.position = false;
                    setting.margin = false;
                    entity.history.enabled = history;

                    setting.pivot = false;
                });
            } else if (/^components.element.(?:width|height)/.test(path)) {
                // width / height change

                if (setting.size) {
                    return;
                }

                setting.size = true;

                setTimeout(() => {
                    const margin = entity.entity.element.margin;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    setting.margin = true;
                    entity.set('components.element.margin', [fixed(margin.x), fixed(margin.y), fixed(margin.z), fixed(margin.w)]);
                    setting.margin = false;
                    entity.history.enabled = history;

                    setting.size = false;
                });
            } else if (/^components.element.margin/.test(path)) {
                // margin change

                if (setting.margin) {
                    return;
                }

                setting.margin = true;

                setTimeout(() => {
                    const pos = entity.entity.getLocalPosition();
                    const width = entity.entity.element.width;
                    const height = entity.entity.element.height;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    setting.position = true;
                    setting.size = true;
                    entity.set('position', [fixed(pos.x), fixed(pos.y), fixed(pos.z)]);
                    entity.set('components.element.width', fixed(width));
                    entity.set('components.element.height', fixed(height));
                    setting.size = false;
                    setting.position = false;
                    entity.history.enabled = history;

                    setting.margin = false;
                });
            } else if (/^components.element.autoWidth/.test(path)) {
                // autoWidth change

                if (setting.autoWidth) {
                    return;
                }

                setting.autoWidth = true;
                setTimeout(() => {
                    const width = entity.entity.element.width;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    entity.set('components.element.width', fixed(width));
                    entity.history.enabled = history;
                    setting.autoWidth = false;
                });
            } else if (/^components.element.autoHeight/.test(path)) {
                // autoHeight change

                if (setting.autoHeight) {
                    return;
                }

                setting.autoHeight = true;
                setTimeout(() => {
                    const height = entity.entity.element.height;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    entity.set('components.element.height', fixed(height));
                    entity.history.enabled = history;
                    setting.autoHeight = false;
                });
            } else if (/^components.element.(?:text|fontAsset)/.test(path)) {
                // text / font change

                if (setting.text) {
                    return;
                }

                setting.text = true;
                if (entity.get('components.element.autoWidth') ||
                    entity.get('components.element.autoHeight')) {

                    setTimeout(() => {
                        const width = entity.entity.element.width;
                        const height = entity.entity.element.height;

                        const history = entity.history.enabled;
                        entity.history.enabled = false;
                        if (entity.get('components.element.autoWidth')) {
                            entity.set('components.element.width', fixed(width));
                        }
                        if (entity.get('components.element.autoHeight')) {
                            entity.set('components.element.height', fixed(height));
                        }
                        entity.history.enabled = history;

                        setting.text = false;
                    });

                }
            } else if (/^components.layoutgroup.enabled/.test(path)) {
                // disabling a layout group

                if (value === false && valueOld === true) {
                    editor.call('entities:layout:storeLayout', entity.get('children'));
                }
            } else if (/^components.layoutchild.excludeFromLayout/.test(path)) {
                // excluding a layout child from the layout

                if (value === true && valueOld === false) {
                    editor.call('entities:layout:storeLayout', [entity.entity.getGuid()]);
                }
            } else if (/^components.scrollbar.orientation/.test(path)) {
                // switching the orientation of a scrollbar - we need to update the anchoring
                // and margins of the track element and handle element to account for the new
                // orientation.

                if (value !== valueOld) {
                    const orientation = value;

                    const containerElementDefaults = editor.call('components:scrollbar:getContainerElementDefaultsForOrientation', orientation);
                    const handleElementDefaults = editor.call('components:scrollbar:getHandleElementDefaultsForOrientation', orientation);

                    if (orientation === ORIENTATION_HORIZONTAL) {
                        delete containerElementDefaults.width;
                    } else if (orientation === ORIENTATION_VERTICAL) {
                        delete containerElementDefaults.height;
                    }

                    const containerEntity = entity;
                    applyProperties(containerEntity, 'components.element', containerElementDefaults);

                    const handleEntityGuid = entity.get('components.scrollbar.handleEntity');
                    const handleEntity = handleEntityGuid && editor.call('entities:get', handleEntityGuid);
                    if (handleEntity) {
                        applyProperties(handleEntity, 'components.element', handleElementDefaults);
                    }
                }
            }
        }));

        // removing a layout group component
        events.push(entity.on('components.layoutgroup:unset', () => {
            setTimeout(() => {
                editor.call('entities:layout:storeLayout', entity.get('children'));
            });
        }));

        events.push(editor.on('gizmo:translate:end', () => {
            const translatedEntities = editor.call('selector:items');

            setTimeout(() => {
                let didReflow = false;

                // Trigger reflow if the user has moved an element that is under
                // the control of a layout group.
                let entity;
                for (let i = 0; i < translatedEntities.length; ++i) {
                    entity = translatedEntities[i];

                    if (editor.call('entities:layout:isUnderControlOfLayoutGroup', entity)) {
                        editor.call('entities:layout:scheduleReflow', entity.get('parent'));
                        didReflow = true;
                    }
                }

                if (didReflow) {
                    setTimeout(() => {
                        // Ensure the reflowed positions are synced to other clients.
                        const parent = editor.call('entities:get', entity.get('parent'));
                        const siblings = parent.get('children');
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
        for (let i = 0, len = events.length; i < len; i++) {
            events[i].unbind();
        }

        events.length = 0;
    };

    editor.on('attributes:clear', clear);

});
