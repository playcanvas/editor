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

        var legacyAudio = editor.call('project:settings').get('use_legacy_audio');
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

            if (list[i] === 'audiosource') {
                this.findByPath([list[i]]).hidden = !legacyAudio;
            }
        }
    });
    menuAddComponent.on('select', function(path) {
        var items = editor.call('selector:items');
        var component = path[0];
        editor.call('entities:addComponent', items, component);
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

        fieldRemove.hidden = ! editor.call('permissions:write');
        events.push(editor.on('permissions:writeState', function(state) {
            fieldRemove.hidden = ! state;
        }));

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
        editor.call('attributes:reference:attach', 'entity:enabled', fieldEnabled.parent.innerElement.firstChild.ui);


        // name
        var fieldName = editor.call('attributes:addField', {
            parent: panel,
            name: 'Name',
            type: 'string',
            link: entities,
            path: 'name',
            trim: true
        });
        fieldName.class.add('entity-name');
        // reference
        editor.call('attributes:reference:attach', 'entity:name', fieldName.parent.innerElement.firstChild.ui);


        // tags
        var fieldTags = editor.call('attributes:addField', {
            parent: panel,
            name: 'Tags',
            placeholder: 'Add Tag',
            type: 'strings',
            link: entities,
            path: 'tags'
        });
        // reference
        editor.call('attributes:reference:attach', 'entity:tags', fieldTags.parent.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:attach', 'entity:position', fieldPosition[0].parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:attach', 'entity:rotation', fieldRotation[0].parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:attach', 'entity:scale', fieldScale[0].parent.innerElement.firstChild.ui);


        // components
        panelComponents = editor.call('attributes:addPanel');

        // add component
        var btnAddComponent = new ui.Button();

        btnAddComponent.hidden = ! editor.call('permissions:write');
        var evtBtnAddComponentPermissions = editor.on('permissions:writeState', function(state) {
            btnAddComponent.hidden = ! state;
        });

        btnAddComponent.text = 'Add Component';
        btnAddComponent.class.add('add-component');
        btnAddComponent.on('click', function(evt) {
            menuAddComponent.position(evt.clientX, evt.clientY);
            menuAddComponent.open = true;
        });
        panel.append(btnAddComponent);
        btnAddComponent.once('destroy', function() {
            evtBtnAddComponentPermissions.unbind();
        });
    });
});



