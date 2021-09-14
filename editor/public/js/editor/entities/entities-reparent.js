editor.once('load', function () {
    'use strict';

    /**
     * Reparent entities under new parent.
     *
     * @param {Array} data - An array of {entity, parent, index} entries where entity is the entity
     * being reparented, parent is the new parent and index is the new index under the parent's children
     */
    editor.method('entities:reparent', function (data, preserveTransform) {
        // remember for undoing
        const records = data.map(entry => {
            const parentOld = editor.call('entities:get', entry.entity.get('parent'));
            const indexOld = parentOld.get('children').indexOf(entry.entity.get('resource_id'));
            const record = {
                entity: entry.entity,
                resourceId: entry.entity.get('resource_id'),
                parentOld: parentOld,
                indOld: indexOld,
                parent: entry.parent,
                indNew: entry.index !== undefined ? entry.index : entry.parent.get('children').length
            };

            if (preserveTransform) {
                record.position = record.entity.entity.getPosition().clone();
                record.rotation = record.entity.entity.getRotation().clone();
            }

            return record;
        });

        // disable selection history
        const selectorHistory = editor.call('selector:history');
        editor.call('selector:history', false);

        const selectorType = editor.call('selector:type');
        const selected = editor.call('selector:items');

        // first remove entities from old parent
        records.forEach(record => {
            const history = record.parentOld.history.enabled;
            record.parentOld.history.enabled = false;
            record.parentOld.removeValue('children', record.resourceId);
            record.parentOld.history.enabled = history;
        });

        // then insert entity under new parent
        records.forEach((record, i) => {
            const history = {
                parent: record.parent.history.enabled,
                parentOld: record.parentOld.history.enabled,
                entity: record.entity.history.enabled
            };
            record.parent.history.enabled = false;
            record.parentOld.history.enabled = false;
            record.entity.history.enabled = false;

            const index = (record.indNew !== -1 && record.indNew <= record.parent.getRaw('children').length ? record.indNew : undefined);
            record.parent.insert('children', record.resourceId, index);
            if (record.parent !== record.parentOld) {
                // set parent
                record.entity.set('parent', record.parent.get('resource_id'));
            }

            if (preserveTransform && record.position) {
                record.entity.entity.setPosition(record.position);
                record.entity.entity.setRotation(record.rotation);

                var localPosition = record.entity.entity.getLocalPosition();
                var localRotation = record.entity.entity.getLocalEulerAngles();
                record.entity.set('position', [localPosition.x, localPosition.y, localPosition.z]);
                record.entity.set('rotation', [localRotation.x, localRotation.y, localRotation.z]);
            }

            record.parent.history.enabled = history.parent;
            record.parentOld.history.enabled = history.parentOld;
            record.entity.history.enabled = history.entity;
        });

        // restore selection
        if (selectorType === 'entity') {
            editor.call('selector:set', 'entity', selected);
        }

        // restore selector history in a timeout (because
        // selection events get added to history in a timeout)
        setTimeout(() => {
            editor.call('selector:history', selectorHistory);
        });

        editor.call('history:add', {
            name: 'reparent entities',
            undo: function () {
                const validRecords = [];
                for (let i = 0; i < records.length; i++) {
                    const record = records[i];
                    var entity = record.entity.latest();
                    if (! entity) continue;

                    var parent = editor.call('entities:get', entity.get('parent'));
                    if (!parent) continue;

                    var parentOld = record.parentOld.latest();
                    if (!parentOld) continue;

                    if (parent.getRaw('children').indexOf(record.resourceId) === -1 || (parentOld.getRaw('children').indexOf(record.resourceId) !== -1 && parentOld !== parent)) {
                        return;
                    }

                    // check if not reparenting to own child
                    var deny = false;
                    var checkParent = editor.call('entities:get', parentOld.get('parent'));
                    while (checkParent) {
                        if (checkParent === entity) {
                            deny = true;
                            checkParent = null;
                            break;
                        } else {
                            checkParent = editor.call('entities:get', checkParent.get('parent'));
                        }
                    }
                    if (deny)
                        continue;

                    validRecords.push(records[i]);
                }

                if (!validRecords.length) return;

                const selectorType = editor.call('selector:type');
                const selected = editor.call('selector:items');
                const selectorHistory = editor.call('selector:history');
                editor.call('selector:history', false);

                // first remove all entities from their current parents
                for (const record of validRecords) {
                    const entity = record.entity.latest();
                    const parent = editor.call('entities:get', entity.get('parent'));

                    const history = parent.history.enabled;
                    parent.history.enabled = false;
                    parent.removeValue('children', record.resourceId);
                    parent.history.enabled = history;
                }

                // then insert entities under their old parents
                for (const record of validRecords) {
                    const entity = record.entity.latest();
                    const parentOld = record.parentOld.latest();
                    const history = {
                        parentOld: parentOld.history.enabled,
                        entity: entity.history.enabled
                    };

                    parentOld.history.enabled = false;
                    if (record.indOld !== -1 && record.indOld <= parentOld.getRaw('children').length) {
                        parentOld.insert('children', record.resourceId, record.indOld);
                    } else {
                        parentOld.insert('children', record.resourceId);
                    }
                    parentOld.history.enabled = history.parentOld;

                    entity.history.enabled = false;
                    entity.set('parent', record.parentOld.get('resource_id'));

                    if (preserveTransform && record.position && entity.entity) {
                        entity.entity.setPosition(record.position);
                        entity.entity.setRotation(record.rotation);

                        var localPosition = entity.entity.getLocalPosition();
                        var localRotation = entity.entity.getLocalEulerAngles();
                        entity.set('position', [localPosition.x, localPosition.y, localPosition.z]);
                        entity.set('rotation', [localRotation.x, localRotation.y, localRotation.z]);
                    }

                    entity.history.enabled = history.entity;

                    editor.call('viewport:render');
                }

                if (selectorType === 'entity') {
                    editor.call('selector:set', 'entity', selected);
                }

                setTimeout(() => {
                    editor.call('selector:history', selectorHistory);
                });
            },

            redo: function () {
                const validRecords = [];
                for (let i = 0; i < records.length; i++) {
                    const record = records[i];
                    var entity = editor.call('entities:get', record.resourceId);
                    if (! entity) continue;

                    var parent = record.parent.latest();
                    if (!parent) continue;

                    var parentOld = editor.call('entities:get', entity.get('parent'));
                    if (! parentOld) continue;

                    if (parentOld.get('children').indexOf(record.resourceId) === -1 || (parent.get('children').indexOf(record.resourceId) !== -1 && parent !== parentOld))
                        continue;

                    // check if not reparenting to own child
                    var deny = false;
                    var checkParent = editor.call('entities:get', parent.get('parent'));
                    while (checkParent) {
                        if (checkParent === entity) {
                            deny = true;
                            checkParent = null;
                            break;
                        } else {
                            checkParent = editor.call('entities:get', checkParent.get('parent'));
                        }
                    }
                    if (deny)
                        continue;

                    validRecords.push(record);
                }

                if (!validRecords.length) return;

                const selectorType = editor.call('selector:type');
                const selected = editor.call('selector:items');
                const selectorHistory = editor.call('selector:history');
                editor.call('selector:history', false);

                for (const record of validRecords) {
                    const entity = record.entity.latest();
                    const parentOld = editor.call('entities:get', entity.get('parent'));
                    const history = parentOld.history.enabled;
                    parentOld.history.enabled = false;
                    parentOld.removeValue('children', record.resourceId);
                    parentOld.history.enabled = history;
                }

                for (const record of validRecords) {
                    const entity = record.entity.latest();
                    const parent = record.parent.latest();
                    const history = {
                        parent: parent.history.enabled,
                        entity: entity.history.enabled
                    };

                    parent.history.enabled = false;
                    if (record.indNew !== -1 && record.indNew <= parent.getRaw('children').length) {
                        parent.insert('children', record.resourceId, record.indNew);
                    } else {
                        parent.insert('children', record.resourceId);
                    }
                    parent.history.enabled = history.parent;

                    entity.history.enabled = false;
                    entity.set('parent', record.parent.get('resource_id'));

                    if (preserveTransform && record.position && entity.entity) {
                        entity.entity.setPosition(record.position);
                        entity.entity.setRotation(record.rotation);

                        var localPosition = entity.entity.getLocalPosition();
                        var localRotation = entity.entity.getLocalEulerAngles();
                        entity.set('position', [localPosition.x, localPosition.y, localPosition.z]);
                        entity.set('rotation', [localRotation.x, localRotation.y, localRotation.z]);
                    }

                    entity.history.enabled = history.entity;

                    editor.call('viewport:render');
                }

                if (selectorType === 'entity') {
                    editor.call('selector:set', 'entity', selected);
                }

                setTimeout(() => {
                    editor.call('selector:history', selectorHistory);
                });
            }
        });

    });
});
