editor.once('load', function() {
    'use strict';

    var projectSettings = editor.call('settings:project');

    var foldStates = {
        'batchGroups': true,
    };

    editor.on('attributes:inspect[editorSettings]', function() {
        // batch groups
        var panelBatchGroups = editor.call('attributes:addPanel', {
            name: 'Batch Groups'
        });
        panelBatchGroups.foldable = true;
        panelBatchGroups.folded = foldStates['batchGroups'];
        panelBatchGroups.on('fold', function () { foldStates['batchGroups'] = true; });
        panelBatchGroups.on('unfold', function () { foldStates['batchGroups'] = false; });
        panelBatchGroups.class.add('component', 'batching');

        // reference
        editor.call('attributes:reference:attach', 'settings:batchGroups', panelBatchGroups, panelBatchGroups.headerElement);

        var batchGroupPanels = {};

        var createBatchGroupPanel = function (group) {
            var groupId = group.id || group.get('id');

            var panelGroup = new ui.Panel(group.name || group.get('name'));
            panelGroup.element.id = 'batchgroup-panel-' + groupId;
            panelGroup.class.add('batch-group');
            panelGroup.foldable = true;
            panelGroup.folded = true;

            // button to remove batch group
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panelGroup.headerElement.appendChild(btnRemove.element);

            // remove batch group and clear entity references
            btnRemove.on('click', function () {
                var oldValue = projectSettings.get('batchGroups.' + groupId);
                var affectedModels = [];
                var affectedElements = [];

                var redo = function () {
                    var settingsHistory = projectSettings.history.enabled;
                    projectSettings.history.enabled = false;
                    projectSettings.unset('batchGroups.' + groupId);
                    projectSettings.history.enabled = settingsHistory;

                    var entities = editor.call('entities:list');
                    for (var i = 0, len = entities.length; i < len; i++) {
                        var entity = entities[i];

                        if (entity.get('components.model.batchGroupId') === groupId) {
                            var history = entity.history.enabled;
                            entity.history.enabled = false;
                            affectedModels.push(entity.get('resource_id'));
                            entity.set('components.model.batchGroupId', null);
                            entity.history.enabled = history;
                        }

                        if (entity.get('components.element.batchGroupId') === groupId) {
                            var history = entity.history.enabled;
                            entity.history.enabled = false;
                            affectedElements.push(entity.get('resource_id'));
                            entity.set('components.element.batchGroupId', null);
                            entity.history.enabled = history;
                        }
                    }
                };

                var undo = function () {
                    var settingsHistory = projectSettings.history.enabled;
                    projectSettings.history.enabled = false;
                    projectSettings.set('batchGroups.' + groupId, oldValue);
                    projectSettings.history.enabled = settingsHistory;

                    for (var i = 0, len = affectedModels.length; i < len; i++) {
                        var entity = editor.call('entities:get', affectedModels[i]);
                        if (! entity) continue;

                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.set('components.model.batchGroupId', groupId);
                        entity.history.enabled = history;
                    }
                    affectedModels.length = 0;

                    for (var i = 0, len = affectedElements.length; i < len; i++) {
                        var entity = editor.call('entities:get', affectedElements[i]);
                        if (! entity) continue;

                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.set('components.element.batchGroupId', groupId);
                        entity.history.enabled = history;
                    }
                    affectedElements.length = 0;
                };

                editor.call('history:add', {
                    name: 'projectSettings.batchGroups.' + groupId,
                    undo: undo,
                    redo: redo
                });

                redo();
            });

            // group name
            var fieldName = editor.call('attributes:addField', {
                parent: panelGroup,
                name: 'Name',
                type: 'string'
            });
            fieldName.class.add('field-batchgroup-name');
            fieldName.value = panelGroup.header;

            // reference
            editor.call('attributes:reference:attach', 'settings:batchGroups:name', fieldName.parent.innerElement.firstChild.ui);

            var suspendEvents = false;
            var evtName = projectSettings.on('batchGroups.' + groupId + '.name:set', function (value) {
                suspendEvents = true;
                fieldName.value = value;
                panelGroup.header = value;
                suspendEvents = false;
            });

            fieldName.on('change', function (value) {
                if (suspendEvents) return;

                if (! value) {
                    fieldName.class.add('error');
                    fieldName.focus();
                    return;
                } else {
                    var batchGroups = projectSettings.get('batchGroups');
                    for (var key in batchGroups) {
                        if (batchGroups[key].name === value) {
                            fieldName.class.add('error');
                            fieldName.focus();
                            return;
                        }
                    }

                    fieldName.class.remove('error');
                    projectSettings.set('batchGroups.' + groupId + '.name', value);
                }
            });

            // dynamic
            var fieldDynamic = editor.call('attributes:addField', {
                parent: panelGroup,
                name: 'Dynamic',
                type: 'checkbox',
                link: projectSettings,
                path: 'batchGroups.' + groupId + '.dynamic'
            });

            // reference
            editor.call('attributes:reference:attach', 'settings:batchGroups:dynamic', fieldDynamic.parent.innerElement.firstChild.ui);

            // max aabb size
            var fieldMaxAabb = editor.call('attributes:addField', {
                parent: panelGroup,
                name: 'Max AABB',
                type: 'number',
                min: 0,
                link: projectSettings,
                path: 'batchGroups.' + groupId + '.maxAabbSize'
            });

            // reference
            editor.call('attributes:reference:attach', 'settings:batchGroups:maxAabbSize', fieldMaxAabb.parent.innerElement.firstChild.ui);

            var prevKey = null;
            var batchGroups = projectSettings.get('batchGroups');
            for (var key in batchGroups) {
                if (parseInt(key, 10) === groupId) {
                    batchGroupPanels[key] = panelGroup;

                    if (prevKey) {
                        panelBatchGroups.appendAfter(panelGroup, batchGroupPanels[prevKey]);
                    } else {
                        panelBatchGroups.prepend(panelGroup);
                    }

                    break;
                } else if (batchGroups[key]) {
                    prevKey = key;
                }
            }

            panelGroup.on('destroy', function () {
                evtName.unbind();
            });
        };

        var removeBatchGroupPanel = function (id) {
            var panel = batchGroupPanels[id];
            if (panel) {
                panel.destroy();
            }

            delete batchGroupPanels[id];
        };

        var evtNewBatchGroup = projectSettings.on('*:set', function (path, value) {
            if (/^batchGroups\.\d+$/.test(path)) {
                if (value) {
                    createBatchGroupPanel(value);
                } else {
                    var parts = path.split('.');
                    removeBatchGroupPanel(parts[parts.length - 1]);
                }
            }
        });

        var evtDeleteBatchGroup = projectSettings.on('*:unset', function (path, value) {
            if (/^batchGroups\.\d+$/.test(path)) {
                removeBatchGroupPanel(value.id);
            }
        });

        panelBatchGroups.on('destroy', function () {
            evtNewBatchGroup.unbind();
            evtDeleteBatchGroup.unbind();
        });

        // existing batch groups
        var batchGroups = projectSettings.get('batchGroups') || {};
        for (var id in batchGroups) {
            createBatchGroupPanel(batchGroups[id]);
        }

        // new batch group button
        var btnAddBatchGroup = new ui.Button({
            text: 'ADD GROUP'
        });
        btnAddBatchGroup.class.add('add-batch-group');
        panelBatchGroups.append(btnAddBatchGroup);
        btnAddBatchGroup.on('click', function () {
            var id = editor.call('editorSettings:batchGroups:create');
            editor.call('editorSettings:batchGroups:focus', id);
        });
    });

    editor.method('editorSettings:batchGroups:create', function () {
        var batchGroups = projectSettings.get('batchGroups');

        // calculate id of new group and new name
        var id = 100000;
        for (var key in batchGroups) {
            id = Math.max(parseInt(key, 10) + 1, id);
        }

        projectSettings.set('batchGroups.' + id, {
            id: id,
            name: 'New Batch Group',
            maxAabbSize: 100,
            dynamic: true
        });

        return id;
    });

    editor.method('editorSettings:batchGroups:focus', function (groupId) {
        var element = document.getElementById('batchgroup-panel-' + groupId);
        if (! element) return;

        editor.call('editorSettings:panel:unfold', 'batching');
        element.ui.folded = false;
        element.querySelector('.field-batchgroup-name > input').focus();
    });
});
