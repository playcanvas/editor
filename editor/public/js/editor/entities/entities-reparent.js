editor.once('load', function () {
    'use strict';

    /**
     * Reparent entities under new parent.
     * @param {Array} data An array of {entity, parent, index} entries where entity is the entity
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

        records.forEach((record, i) => {
            record.parent.history.enabled = false;
            record.parentOld.history.enabled = false;
            record.entity.history.enabled = false;

            if (record.parent === record.parentOld) {
                // move
                record.parent.removeValue('children', record.resourceId);
                record.parent.insert('children', record.resourceId, record.indNew + ((record.indNew > record.indOld) ? (records.length - 1 - i) : 0));
            } else {
                // remove from old parent
                record.parentOld.removeValue('children', record.resourceId);

                // add to new parent children
                if (record.indNew !== -1) {
                    // before other item
                    record.parent.insert('children', record.resourceId, record.indNew);
                } else {
                    // at the end
                    record.parent.insert('children', record.resourceId);
                }

                // set parent
                record.entity.set('parent', record.parent.get('resource_id'));
            }

            if (preserveTransform && record.position) {
                record.entity.entity.setPosition(record.position);
                record.entity.entity.setRotation(record.rotation);

                var localPosition = record.entity.entity.getLocalPosition();
                var localRotation = record.entity.entity.getLocalEulerAngles();
                record.entity.set('position', [ localPosition.x, localPosition.y, localPosition.z ]);
                record.entity.set('rotation', [ localRotation.x, localRotation.y, localRotation.z ]);
            }

            record.parent.history.enabled = true;
            record.parentOld.history.enabled = true;
            record.entity.history.enabled = true;
        });

        editor.call('history:add', {
            name: 'reparent entities',
            undo: function() {
                for (let i = 0; i < records.length; i++) {
                    const record = records[i];
                    var entity = record.entity.latest();
                    if (! entity) continue;

                    var parent = editor.call('entities:get', entity.get('parent'));
                    if (!parent) continue;

                    var parentOld = record.parentOld.latest();
                    if (!parentOld) continue;

                    if (parent.get('children').indexOf(record.resourceId) === -1 || (parentOld.get('children').indexOf(record.resourceId) !== -1 && parentOld !== parent)) {
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

                    parent.history.enabled = false;
                    parent.removeValue('children', record.resourceId);
                    parent.history.enabled = true;

                    parentOld.history.enabled = false;
                    var off = parent !== parentOld ? 0 : ((record.indNew < record.indOld) ? (records.length - 1 - i) : 0);
                    parentOld.insert('children', record.resourceId, record.indOld === -1 ? undefined : record.indOld + off);
                    parentOld.history.enabled = true;

                    entity.history.enabled = false;
                    entity.set('parent', record.parentOld.get('resource_id'));

                    if (preserveTransform && record.position && entity.entity) {
                        entity.entity.setPosition(record.position);
                        entity.entity.setRotation(record.rotation);

                        var localPosition = entity.entity.getLocalPosition();
                        var localRotation = entity.entity.getLocalEulerAngles();
                        entity.set('position', [ localPosition.x, localPosition.y, localPosition.z ]);
                        entity.set('rotation', [ localRotation.x, localRotation.y, localRotation.z ]);
                    }

                    entity.history.enabled = true;

                    editor.call('viewport:render');
                }
            },

            redo: function () {
                for (let i = 0; i < records.length; i++) {
                    const record = records[i];
                    var entity = editor.call('entities:get', record.resourceId);
                    if (! entity) continue;

                    var parent = editor.call('entities:get', record.parent.get('resource_id'));
                    var parentOld = editor.call('entities:get', entity.get('parent'));
                    if (! parentOld || ! parent) continue;

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

                    parentOld.history.enabled = false;
                    parentOld.removeValue('children', record.resourceId);
                    parentOld.history.enabled = true;

                    parent.history.enabled = false;
                    var off = parent !== parentOld ? 0 : ((record.indNew > record.indOld) ? (records.length - 1 - i) : 0);
                    parent.insert('children', record.resourceId, record.indNew + off);
                    parent.history.enabled = true;

                    entity.history.enabled = false;
                    entity.set('parent', record.parent.get('resource_id'));

                    if (preserveTransform && record.position && entity.entity) {
                        entity.entity.setPosition(record.position);
                        entity.entity.setRotation(record.rotation);

                        var localPosition = entity.entity.getLocalPosition();
                        var localRotation = entity.entity.getLocalEulerAngles();
                        entity.set('position', [ localPosition.x, localPosition.y, localPosition.z ]);
                        entity.set('rotation', [ localRotation.x, localRotation.y, localRotation.z ]);
                    }

                    entity.history.enabled = true;

                    editor.call('viewport:render');
                }
            }
        });

    });
});
