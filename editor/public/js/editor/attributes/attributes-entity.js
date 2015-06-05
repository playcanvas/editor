editor.once('load', function() {
    'use strict';

    var panelComponents;

    editor.method('attributes:entity.panelComponents', function() {
        return panelComponents;
    });

    // add component menu
    var menuAddComponent = new ui.Menu();
    var components = editor.call('components:schema');
    var list = editor.call('components:list');
    for(var i = 0; i < list.length; i++) {
        menuAddComponent.append(new ui.MenuItem({
            text: components[list[i]].title,
            value: list[i]
        }));
    }
    menuAddComponent.on('open', function() {
        var items = editor.call('selector:items');
        for(var i = 0; i < list.length; i++) {
            var different = false;
            var disabled = items[0].has('components.' + list[i]);

            for(var n = 1; n < items.length; n++) {
                if (disabled !== items[n].has('components.' + list[i])) {
                    var different = true;
                    break;
                }
            }
            this.findByPath([ list[i] ]).disabled = different ? false : disabled;
        }
    });
    menuAddComponent.on('select', function(path) {
        var componentData = editor.call('components:getDefault', path[0]);
        var items = editor.call('selector:items');
        var records = [ ];
        var component = path[0];

        for(var i = 0; i < items.length; i++) {
            if (items[i].has('components.' + component))
                continue;

            records.push({
                get: items[i].history._getItemFn,
                value: componentData
            });

            items[i].history.enabled = false;
            items[i].set('components.' + component, componentData);
            items[i].history.enabled = true;
        }

        // if it's a collision or rigidbody component then enable physics
        if (component === 'collision' || component === 'rigidbody')
            editor.call('project:enablePhysics');

        editor.call('history:add', {
            name: 'entities.' + component,
            undo: function() {
                for(var i = 0; i < records.length; i++) {
                    var item = records[i].get();
                    if (! item)
                        continue;
                    item.history.enabled = false;
                    item.unset('components.' + component);
                    item.history.enabled = true;
                }
            },
            redo: function() {
                for(var i = 0; i < records.length; i++) {
                    var item = records[i].get();
                    if (! item)
                        continue;
                    item.history.enabled = false;
                    item.set('components.' + component, records[i].value);
                    item.history.enabled = true;
                }
            }
        });
    });
    editor.call('layout.root').append(menuAddComponent);


    editor.method('attributes:entity:addComponentPanel', function(args) {
        var title = args.title;
        var name = args.name;
        var entities = args.entities;
        var events = [ ];

        // panel
        var panel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: title
        });
        panel.class.add('component', 'entity', name);
        // reference
        editor.call('attributes:reference:' + name + ':attach', panel, panel.headerElementTitle);

        // show/hide panel
        var checkingPanel;
        var checkPanel = function() {
            checkingPanel = false;

            var show = entities[0].has('components.' + name);
            for(var i = 1; i < entities.length; i++) {
                if (show !== entities[i].has('components.' + name)) {
                    show = false;
                    break;
                }
            }

            panel.disabled = ! show;
            panel.hidden = ! show;
        };
        var queueCheckPanel = function() {
            if (checkingPanel)
                return;

            checkingPanel = true;
            setTimeout(checkPanel);
        }
        checkPanel();
        for(var i = 0; i < entities.length; i++) {
            events.push(entities[i].on('components.' + name + ':set', queueCheckPanel));
            events.push(entities[i].on('components.' + name + ':unset', queueCheckPanel));
        }
        panel.once('destroy', function() {
            for(var i = 0; i < entities.length; i++)
                events[i].unbind();
        });

        // remove
        var fieldRemove = new ui.Button();
        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function() {
            var records = [ ];

            for(var i = 0; i < entities.length; i++) {
                records.push({
                    get: entities[i].history._getItemFn,
                    value: entities[i].get('components.' + name)
                });

                entities[i].history.enabled = false;
                entities[i].unset('components.' + name);
                entities[i].history.enabled = true;
            }

            editor.call('history:add', {
                name: 'entities.set[components.' + name + ']',
                undo: function() {
                    for(var i = 0; i < records.length; i++) {
                        var item = records[i].get();
                        if (! item)
                            continue;

                        item.history.enabled = false;
                        item.set('components.' + name, records[i].value);
                        item.history.enabled = true;
                    }
                },
                redo: function() {
                    for(var i = 0; i < records.length; i++) {
                        var item = records[i].get();
                        if (! item)
                            continue;

                        item.history.enabled = false;
                        item.unset('components.' + name);
                        item.history.enabled = true;
                    }
                }
            });
        });
        panel.headerAppend(fieldRemove);

        // enable/disable
        var fieldEnabled = editor.call('attributes:addField', {
            panel: panel,
            type: 'checkbox',
            link: entities,
            path: 'components.' + name + '.enabled'
        });
        fieldEnabled.class.remove('tick');
        fieldEnabled.class.add('component-toggle');
        fieldEnabled.element.parentNode.removeChild(fieldEnabled.element);
        panel.headerAppend(fieldEnabled);

        // toggle-label
        var labelEnabled = new ui.Label();
        labelEnabled.renderChanges = false;
        labelEnabled.class.add('component-toggle-label');
        panel.headerAppend(labelEnabled);
        labelEnabled.text = fieldEnabled.value ? 'On' : 'Off';
        fieldEnabled.on('change', function(value) {
            labelEnabled.text = value ? 'On' : 'Off';
        });

        return panel;
    });


    editor.method('attributes:entity:addAssetsList', function(args) {
        var entities = args.entities;
        var title = args.title;
        var assetType = args.type;
        var path = args.path;
        var panel = args.panel;
        var events = [ ];

        // assets
        var fieldAssetsList = new ui.List();
        fieldAssetsList.flexGrow = 1;

        // drop
        var dropRef = editor.call('drop:target', {
            ref: fieldAssetsList.element,
            type: 'asset.' + type,
            filter: function(type, data) {
                if (type !== 'asset.' + assetType)
                    return false;

                for(var i = 0; i < entities.length; i++) {
                    if (entities[i].get(path).indexOf(data.id) === -1)
                        return true;
                }

                return false;
            },
            drop: function(type, data) {
                if (type !== 'asset.' + assetType)
                    return;

                for(var i = 0; i < entities.length; i++) {
                    if (entities[i].get(path).indexOf(data.id) !== -1)
                        continue;

                    // TODO
                    // history

                    entities[i].history.enabled = false;
                    entities[i].insert(path, data.id, 0);
                    entities[i].history.enabled = true;
                }
            }
        });
        dropRef.disabled = panel.disabled;
        panel.on('enable', function() {
            dropRef.enabled = true;
        });
        panel.on('disable', function() {
            dropRef.disabled = true;

            // clear list item
            var items = fieldAssetsList.element.children;
            var i = items.length;
            while(i-- > 1) {
                if (! items[i].ui || ! (items[i].ui instanceof ui.ListItem))
                    continue;

                items[i].ui.destroy();
            }

            assetIndex = { };
        });
        fieldAssetsList.on('destroy', function() {
            dropRef.unregister();
        });

        var fieldAssets = editor.call('attributes:addField', {
            parent: panel,
            name: 'Assets',
            type: 'element',
            element: fieldAssetsList
        });
        fieldAssets.class.add('assets');

        // reference assets
        editor.call('attributes:reference:' + assetType + ':assets:attach', fieldAssets.parent.innerElement.firstChild.ui);

        // assets list
        var itemAdd = new ui.ListItem({
            text: 'Add ' + title
        });
        itemAdd.class.add('add-asset');
        fieldAssetsList.append(itemAdd);

        // add asset icon
        var iconAdd = document.createElement('span');
        iconAdd.classList.add('icon');
        itemAdd.element.appendChild(iconAdd);

        // index list items by asset id
        var assetIndex = { };

        // add asset
        var addAsset = function(assetId, after) {
            var item = assetIndex[assetId];
            if (item) {
                item.count++;
                item.text = (item.count === entities.length ? '' : '* ') + item._assetText;
                return;
            }

            var asset = editor.call('assets:get', assetId);
            var text = assetId;
            if (asset && asset.get('name'))
                text = asset.get('name');

            item = new ui.ListItem({
                text: (entities.length === 1) ? text : '* ' + text
            });
            item.count = 1;
            item._assetText = text;

            if (after) {
                fieldAssetsList.appendAfter(item, after);
            } else {
                fieldAssetsList.append(item);
            }

            assetIndex[assetId] = item;

            // remove button
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            btnRemove.on('click', function() {
                var records = [ ];

                for(var i = 0; i < entities.length; i++) {
                    if (entities[i].get(path).indexOf(assetId) === -1)
                        continue;

                    // TODO
                    // history

                    entities[i].history.enabled = false;
                    entities[i].removeValue(path, assetId);
                    entities[i].history.enabled = true;
                }
            });
            btnRemove.parent = item;
            item.element.appendChild(btnRemove.element);

            item.once('destroy', function() {
                delete assetIndex[assetId];
            });
        };

        // on adding new asset
        itemAdd.on('click', function() {
            // call picker
            editor.call('picker:asset', assetType, null);

            // on pick
            var evtPick = editor.once('picker:asset', function(asset) {
                var records = [ ];
                var assetId = asset.get('id');

                for(var i = 0; i < entities.length; i++) {
                    // already in list
                    if (entities[i].get(path).indexOf(assetId) !== -1)
                        continue;

                    // TODO
                    // history

                    entities[i].history.enabled = false;
                    entities[i].insert(path, assetId, 0);
                    entities[i].history.enabled = true;
                    evtPick = null;
                }
            });

            editor.once('picker:asset:close', function() {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        });

        // list
        for(var i = 0; i < entities.length; i++) {
            var assets = entities[i].get(path);
            if (assets) {
                for(var a = 0; a < assets.length; a++)
                    addAsset(assets[a]);
            }

            events.push(entities[i].on(path + ':set', function(assets) {
                for(var a = 0; a < assets.length; a++)
                    addAsset(assets[a]);
            }))

            events.push(entities[i].on(path + ':insert', function(assetId, ind) {
                var before;
                if (ind === 0) {
                    before = itemAdd;
                } else {
                    before = assetIndex[this.get(path + '.' + ind)];
                }
                addAsset(assetId, before);
            }));

            events.push(entities[i].on(path + ':remove', function(assetId) {
                var item = assetIndex[assetId];

                if (! item)
                    return;

                item.count--;

                if (item.count === 0)
                    item.destroy();
            }));
        }

        panel.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });


    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length > 1) {
            editor.call('attributes:header', entities.length + ' Entities');
        } else {
            editor.call('attributes:header', 'Entity');
        }

        // panel
        var panel = editor.call('attributes:addPanel');
        panel.class.add('component');


        // enabled
        var fieldEnabled = editor.call('attributes:addField', {
            parent: panel,
            name: 'Enabled',
            type: 'checkbox',
            link: entities,
            path: 'enabled'
        });
        // reference
        editor.call('attributes:reference:entity:enabled:attach', fieldEnabled.parent.innerElement.firstChild.ui);


        // name
        var fieldName = editor.call('attributes:addField', {
            parent: panel,
            name: 'Name',
            type: 'string',
            link: entities,
            path: 'name'
        });
        // reference
        editor.call('attributes:reference:entity:name:attach', fieldName.parent.innerElement.firstChild.ui);


        // position
        var fieldPosition = editor.call('attributes:addField', {
            parent: panel,
            name: 'Position',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 3,
            step: .05,
            type: 'vec3',
            link: entities,
            path: 'position'
        });
        // reference
        editor.call('attributes:reference:entity:position:attach', fieldPosition[0].parent.innerElement.firstChild.ui);


        // rotation
        var fieldRotation = editor.call('attributes:addField', {
            parent: panel,
            name: 'Rotation',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 2,
            step: .1,
            type: 'vec3',
            link: entities,
            path: 'rotation'
        });
        // reference
        editor.call('attributes:reference:entity:rotation:attach', fieldRotation[0].parent.innerElement.firstChild.ui);


        // scale
        var fieldScale = editor.call('attributes:addField', {
            parent: panel,
            name: 'Scale',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 3,
            step: .05,
            type: 'vec3',
            link: entities,
            path: 'scale'
        });
        // reference
        editor.call('attributes:reference:entity:scale:attach', fieldScale[0].parent.innerElement.firstChild.ui);


        // components
        panelComponents = editor.call('attributes:addPanel');

        // add component
        var btnAddComponent = new ui.Button();
        btnAddComponent.text = 'Add Component';
        btnAddComponent.class.add('add-component');
        btnAddComponent.on('click', function(evt) {
            menuAddComponent.position(evt.clientX, evt.clientY);
            menuAddComponent.open = true;
        });
        panel.append(btnAddComponent);

        // if (entities.length === 1) {
        //     // json panel
        //     var panelJson = editor.call('attributes:addPanel', {
        //         name: 'JSON'
        //     });

        //     // code
        //     var fieldJson = editor.call('attributes:addField', {
        //         parent: panelJson,
        //         type: 'code'
        //     });

        //     fieldJson.text = JSON.stringify(entities[0].json(), null, 4);

        //     // changes
        //     var evtSet = entities[0].on('*:set', function() {
        //         // console.log('set', arguments)
        //         fieldJson.text = JSON.stringify(entities[0].json(), null, 4);
        //     });
        //     var evtUnset = entities[0].on('*:unset', function() {
        //         // console.log('unset', arguments)
        //         fieldJson.text = JSON.stringify(entities[0].json(), null, 4);
        //     });
        //     var evtInsert = entities[0].on('*:insert', function() {
        //         // console.log('insert', arguments)
        //         fieldJson.text = JSON.stringify(entities[0].json(), null, 4);
        //     });
        //     var evtRemove = entities[0].on('*:remove', function() {
        //         // console.log('remove', arguments)
        //         fieldJson.text = JSON.stringify(entities[0].json(), null, 4);
        //     });
        //     var evtMove = entities[0].on('*:move', function() {
        //         // console.log('move', arguments)
        //         fieldJson.text = JSON.stringify(entities[0].json(), null, 4);
        //     });

        //     fieldJson.on('destroy', function() {
        //         evtSet.unbind();
        //         evtUnset.unbind();
        //         evtInsert.unbind();
        //         evtRemove.unbind();
        //         evtMove.unbind();
        //     });
        // }
    });
});
