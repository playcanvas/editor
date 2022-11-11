editor.once('load', function () {
    'use strict';

    const projectSettings = editor.call('settings:project');

    var entityInspector;

    // legacy
    editor.method('attributes:entity.panelComponents', function () {
        return entityInspector;
    });

    // legacy
    editor.method('attributes:entity:addComponentPanel', function (args) {
        var title = args.title;
        var name = args.name;
        var entities = args.entities;
        var events = [];

        // panel
        var panel = editor.call('attributes:addPanel', {
            parent: entityInspector,
            name: title
        });
        panel.class.add('component', 'entity', name);
        // reference
        editor.call('attributes:reference:attach', name + ':component', panel, panel.headerElementTitle);

        // override for new component
        editor.call('attributes:registerOverridePath', 'components.' + name, panel.element);

        // show/hide panel
        var checkingPanel;
        var checkPanel = function () {
            checkingPanel = false;

            var show = entities[0].has('components.' + name);
            for (let i = 1; i < entities.length; i++) {
                if (show !== entities[i].has('components.' + name)) {
                    show = false;
                    break;
                }
            }

            panel.disabled = !show;
            panel.hidden = !show;
        };
        var queueCheckPanel = function () {
            if (checkingPanel)
                return;

            checkingPanel = true;
            setTimeout(checkPanel);
        };
        checkPanel();
        for (let i = 0; i < entities.length; i++) {
            events.push(entities[i].on('components.' + name + ':set', queueCheckPanel));
            events.push(entities[i].on('components.' + name + ':unset', queueCheckPanel));
        }
        panel.once('destroy', function () {
            for (let i = 0; i < entities.length; i++)
                events[i].unbind();
        });

        // remove
        var fieldRemove = new ui.Button();

        fieldRemove.hidden = !editor.call('permissions:write');
        events.push(editor.on('permissions:writeState', function (state) {
            fieldRemove.hidden = !state;
        }));

        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function () {
            var records = [];

            for (let i = 0; i < entities.length; i++) {
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
                undo: function () {
                    for (let i = 0; i < records.length; i++) {
                        var item = records[i].item.latest();
                        if (!item)
                            continue;

                        item.history.enabled = false;
                        item.set('components.' + name, records[i].value);
                        item.history.enabled = true;
                    }
                },
                redo: function () {
                    for (let i = 0; i < records.length; i++) {
                        var item = records[i].item.latest();
                        if (!item)
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
        fieldEnabled.on('change', function (value) {
            labelEnabled.text = value ? 'On' : 'Off';
        });

        return panel;
    });

    var templateOverrides = new pcui.TemplateOverridesView({
        flex: true,
        assets: editor.call('assets:raw'),
        entities: editor.call('entities:raw'),
        projectSettings: editor.call('settings:project'),
        hidden: true
    });
    editor.call('layout.root').append(templateOverrides);

    var templateInspector = new pcui.TemplatesEntityInspector({ // eslint-disable-line no-unused-vars
        flex: true,
        assets: editor.call('assets:raw'),
        entities: editor.call('entities:raw'),
        templateOverridesDiffView: templateOverrides,
        hidden: true
    });

    // disable attributes panel when overrides diff is open
    templateOverrides.on('show', () => {
        editor.call('layout.attributes').enabled = false;
    });

    templateOverrides.on('hide', () => {
        editor.call('layout.attributes').enabled = editor.call('permissions:write');
    });

    entityInspector = new pcui.EntityInspector({
        assets: editor.call('assets:raw'),
        entities: editor.call('entities:raw'),
        projectSettings: editor.call('settings:project'),
        history: editor.call('editor:history'),
        templateOverridesDiffView: templateOverrides
    });

    // before clearing inspector, preserve elements
    editor.on('attributes:beforeClear', function () {
        entityInspector.unlink();
        if (entityInspector.parent) {
            entityInspector.parent.remove(entityInspector);
        }

        // destroy legacy script inspector
        if (projectSettings.get('useLegacyScripts')) {
            const legacyScriptInspector = entityInspector.dom.querySelector('.ui-panel.script');
            if (legacyScriptInspector) {
                legacyScriptInspector.ui.destroy();
            }
        }
    });

    // link data to fields when inspecting
    editor.on('attributes:inspect[entity]', function (entities) {
        if (entities.length > 1) {
            editor.call('attributes:header', entities.length + ' Entities');
        } else {
            editor.call('attributes:header', 'Entity');
        }

        var root = editor.call('attributes.rootPanel');

        if (!entityInspector.parent)
            root.append(entityInspector);

        entityInspector.link(entities);
    });

    editor.on('attributes:clear', function () {
        entityInspector.unlink();
    });
});
