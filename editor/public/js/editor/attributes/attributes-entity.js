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
            text: components[list[i]].$title,
            value: list[i]
        }));
    }
    menuAddComponent.on('open', function() {
        var items = editor.call('selector:items');

        var legacyAudio = editor.call('settings:project').get('useLegacyAudio');
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

            if (list[i] === 'audiosource')
                this.findByPath([list[i]]).hidden = ! legacyAudio;
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
        editor.call('attributes:reference:attach', name + ':component', panel, panel.headerElementTitle);

        // override for new component
        editor.call('attributes:registerOverridePath', 'components.' + name, panel.element);

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
                    item: entities[i],
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
                        var item = records[i].item.latest();
                        if (! item)
                            continue;

                        item.history.enabled = false;
                        item.set('components.' + name, records[i].value);
                        item.history.enabled = true;
                    }
                },
                redo: function() {
                    for(var i = 0; i < records.length; i++) {
                        var item = records[i].item.latest();
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
        editor.call('attributes:registerOverridePath', `components.${name}.enabled`, fieldEnabled.element);
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


    var items = null;
    var argsList = [ ];
    var argsFieldsChanges = [ ];


    var templateOverrides = new pcui.TemplateOverridesView({
        flex: true,
        assets: editor.call('assets:raw'),
        entities: editor.call('entities:raw'),
        projectSettings: editor.call('settings:project'),
        hidden: true
    });
    editor.call('layout.root').append(templateOverrides);

    var templateInspector = new pcui.TemplatesEntityInspector({
        flex: true,
        assets: editor.call('assets:raw'),
        entities: editor.call('entities:raw'),
        templateOverridesDiffView: templateOverrides,
        hidden: true
    });

    var overridesSidebar = editor.call('layout.overridesSidebar');

    // disable attributes panel when overrides diff is open
    templateOverrides.on('show', () => {
        editor.call('layout.attributes').enabled = false;
    });

    templateOverrides.on('hide', () => {
        editor.call('layout.attributes').enabled = editor.call('permissions:write');
    });

    // initialize fields
    var initialize = function() {
        items = { };

        var root = editor.call('attributes.rootPanel');

        // template panel
        if (editor.call('users:hasFlag', 'hasTemplates') && !editor.call('settings:project').get('useLegacyScripts')) {
            items.panelTemplate = templateInspector;
            root.append(items.panelTemplate);
        }

        // panel
        var panel = items.panel = editor.call('attributes:addPanel');
        panel.class.add('component');


        // enabled
        var argsEnabled = {
            parent: panel,
            name: 'Enabled',
            type: 'checkbox',
            path: 'enabled'
        };
        items.fieldEnabled = editor.call('attributes:addField', argsEnabled);
        editor.call('attributes:reference:attach', 'entity:enabled', items.fieldEnabled.parent.innerElement.firstChild.ui);
        argsList.push(argsEnabled);
        argsFieldsChanges.push(items.fieldEnabled);


        // name
        var argsName = {
            parent: panel,
            name: 'Name',
            type: 'string',
            trim: true,
            path: 'name'
        };
        items.fieldName = editor.call('attributes:addField', argsName);
        items.fieldName.class.add('entity-name');
        editor.call('attributes:reference:attach', 'entity:name', items.fieldName.parent.innerElement.firstChild.ui);
        argsList.push(argsName);
        argsFieldsChanges.push(items.fieldName);


        // tags
        var argsTags = {
            parent: panel,
            name: 'Tags',
            placeholder: 'Add Tag',
            type: 'tags',
            tagType: 'string',
            path: 'tags'
        };
        items.fieldTags = editor.call('attributes:addField', argsTags);
        editor.call('attributes:reference:attach', 'entity:tags', items.fieldTags.parent.parent.innerElement.firstChild.ui);
        argsList.push(argsTags);


        // position
        var argsPosition = {
            parent: panel,
            name: 'Position',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 3,
            step: 0.05,
            type: 'vec3',
            path: 'position'
        };
        items.fieldPosition = editor.call('attributes:addField', argsPosition);
        editor.call('attributes:reference:attach', 'entity:position', items.fieldPosition[0].parent.innerElement.firstChild.ui);
        argsList.push(argsPosition);
        argsFieldsChanges = argsFieldsChanges.concat(items.fieldPosition);

        // rotation
        var argsRotation = {
            parent: panel,
            name: 'Rotation',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 2,
            step: 0.1,
            type: 'vec3',
            path: 'rotation'
        };
        items.fieldRotation = editor.call('attributes:addField', argsRotation);
        editor.call('attributes:reference:attach', 'entity:rotation', items.fieldRotation[0].parent.innerElement.firstChild.ui);
        argsList.push(argsRotation);
        argsFieldsChanges = argsFieldsChanges.concat(items.fieldRotation);


        // scale
        var argsScale = {
            parent: panel,
            name: 'Scale',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 3,
            step: 0.05,
            type: 'vec3',
            path: 'scale'
        };
        items.fieldScale = editor.call('attributes:addField', argsScale);
        editor.call('attributes:reference:attach', 'entity:scale', items.fieldScale[0].parent.innerElement.firstChild.ui);
        argsList.push(argsScale);
        argsFieldsChanges = argsFieldsChanges.concat(items.fieldScale);


        // components
        panelComponents = items.panelComponents = editor.call('attributes:addPanel');

        // add component
        var btnAddComponent = items.btnAddComponent = new ui.Button();

        btnAddComponent.hidden = ! editor.call('permissions:write');
        editor.on('permissions:writeState', function(state) {
            btnAddComponent.hidden = ! state;
        });

        btnAddComponent.text = 'Add Component';
        btnAddComponent.class.add('add-component');
        btnAddComponent.on('click', function(evt) {
            menuAddComponent.position(evt.clientX, evt.clientY);
            menuAddComponent.open = true;
        });
        panel.append(btnAddComponent);
    };

    // before clearing inspector, preserve elements
    editor.on('attributes:beforeClear', function() {
        if (! items || ! items.panel.parent)
            return;

        if (items.panelTemplate) {
            items.panelTemplate.parent.remove(items.panelTemplate);
        }

        // remove panel from inspector
        items.panel.parent.remove(items.panel);

        // clear components
        items.panelComponents.parent.remove(items.panelComponents);
        items.panelComponents.clear();

        // unlink fields
        for(var i = 0; i < argsList.length; i++) {
            argsList[i].link = null;
            argsList[i].unlinkField();
        }
    });

    var inspectEvents = [];

    // link data to fields when inspecting
    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length > 1) {
            editor.call('attributes:header', entities.length + ' Entities');
        } else {
            editor.call('attributes:header', 'Entity');
        }

        if (! items)
            initialize();

        var root = editor.call('attributes.rootPanel');

        if (items.panelTemplate && ! items.panelTemplate.parent)
            root.append(items.panelTemplate);

        if (! items.panel.parent)
            root.append(items.panel);

        if (! items.panelComponents.parent)
            root.append(items.panelComponents);

        // disable renderChanges
        for(var i = 0; i < argsFieldsChanges.length; i++)
            argsFieldsChanges[i].renderChanges = false;

        // link fields
        for(var i = 0; i < argsList.length; i++) {
            argsList[i].link = entities;
            argsList[i].linkField();
        }

        // enable renderChanges
        for(var i = 0; i < argsFieldsChanges.length; i++)
            argsFieldsChanges[i].renderChanges = true;

        onInspect(entities);
    });

    editor.on('attributes:clear', function () {
        onUninspect();
    });

    var toggleFields = function (selectedEntities) {
        var disablePositionXY = false;
        var disableRotation = false;
        var disableScale = false;

        for (var i = 0, len = selectedEntities.length; i < len; i++) {
            var entity = selectedEntities[i];

            // disable rotation / scale for 2D screens
            if (entity.get('components.screen.screenSpace')) {
                disableRotation = true;
                disableScale = true;
            }

            // disable position on the x/y axis for elements that are part of a layout group
            if (editor.call('entities:layout:isUnderControlOfLayoutGroup', entity)) {
                disablePositionXY = true;
            }
        }

        items.fieldPosition[0].enabled = !disablePositionXY;
        items.fieldPosition[1].enabled = !disablePositionXY;

        for (var i = 0; i < 3; i++) {
            items.fieldRotation[i].enabled = !disableRotation;
            items.fieldScale[i].enabled = !disableScale;

            items.fieldRotation[i].renderChanges = !disableRotation;
            items.fieldScale[i].renderChanges = !disableScale;
        }

        if (items.panelTemplate) {
            if (selectedEntities.length === 1) {
                items.panelTemplate.entity = selectedEntities[0];
            } else {
                items.panelTemplate.entity = null;
            }
        }

        if (overridesSidebar) {
            if (selectedEntities.length === 1) {
                overridesSidebar.entity = selectedEntities[0];

                editor.call('attributes:registerOverridePath', 'enabled', items.fieldEnabled.parent.element);
                editor.call('attributes:registerOverridePath', 'name', items.fieldName.parent.element);
                editor.call('attributes:registerOverridePath', 'tags', items.fieldTags.parent.parent.element);
                editor.call('attributes:registerOverridePath', 'position', items.fieldPosition[0].parent.element);
                editor.call('attributes:registerOverridePath', 'rotation', items.fieldRotation[0].parent.element);
                editor.call('attributes:registerOverridePath', 'scale', items.fieldScale[0].parent.element);
            }
        }
    };

    var onInspect = function (entities) {
        onUninspect();

        var addEvents = function (entity) {
            inspectEvents.push(entity.on('*:set', function (path) {
                if (/components.screen.screenSpace/.test(path) ||
                    /^parent/.test(path) ||
                    /components.layoutchild.excludeFromLayout/.test(path)) {
                    toggleFieldsIfNeeded(entity);
                }
            }));
        };

        var toggleFieldsIfNeeded = function (entity) {
            if (editor.call('selector:has', entity))
                toggleFields(editor.call('selector:items'));
        };


        for (var i = 0, len = entities.length; i < len; i++) {
            addEvents(entities[i]);
        }

        toggleFields(entities);
    };

    var onUninspect = function () {
        for (var i = 0; i < inspectEvents.length; i++) {
            inspectEvents[i].unbind();
        }

        inspectEvents.length = 0;

        if (items && items.panelTemplate) {
            templateOverrides.hidden = true;
            items.panelTemplate.hidden = true;
            items.panelTemplate.entity = null;
        }

        if (overridesSidebar) {
            overridesSidebar.clearOverrides();
        }
    };
});
