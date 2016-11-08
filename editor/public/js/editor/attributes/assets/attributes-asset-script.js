editor.once('load', function() {
    'use strict';

    var legacyScripts = editor.call('project:settings').get('use_legacy_scripts');


    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'script' || assets[0].get('source'))
            return;

        var asset = assets[0];
        var events = [ ];

        // panel
        var panel = editor.call('attributes:assets:panel');

        if (! legacyScripts) {
            // scripts
            var panelScripts = editor.call('attributes:addPanel', {
                name: 'Scripts'
            });
            panelScripts.class.add('component', 'asset-script');


            // order
            var fieldOrder = editor.call('attributes:addField', {
                parent: panel,
                name: 'Loading Order'
            });
            var btnOrder = new ui.Button({
                text: 'Manage'
            });
            btnOrder.class.add('loading-order');
            var panelOrder = fieldOrder.parent;
            panelOrder.innerElement.removeChild(fieldOrder.element);
            panelOrder.append(btnOrder);
            btnOrder.on('click', function() {
                editor.call('selector:set', 'designerSettings', [ editor.call('designerSettings') ]);
                setTimeout(function() {
                    editor.call('designerSettings:panel:unfold', 'scripts-order');
                }, 0);
            });
            // reparent
            var preloadField = panel.innerElement.querySelector('.ui-panel.field-checkbox.preload');
            if (preloadField && preloadField.nextSibling) {
                fieldOrder.parent.parent.innerElement.removeChild(fieldOrder.parent.element);
                panel.innerElement.insertBefore(fieldOrder.parent.element, preloadField.nextSibling);
            }
            // reference
            editor.call('attributes:reference:attach', 'asset:script:order', fieldOrder.parent.innerElement.firstChild.ui);


            // parse
            var btnParse = new ui.Button({
                text: 'Parse'
            });
            btnParse.hidden = ! editor.call('permissions:write');
            events.push(editor.on('permissions:writeState', function(state) {
                btnParse.hidden = ! state;
            }));
            btnParse.class.add('parse-script');
            btnParse.on('click', function() {
                btnParse.disabled = true;

                editor.call('scripts:parse', asset, function(err, result) {
                    btnParse.disabled = false;

                    if (err) {
                        panelErrors.hidden = false;
                        panelErrors.clear();
                        panelErrors.append(new ui.Label({ text: err.message }));
                        return;
                    }

                    // script validation errors
                    panelErrors.clear();

                    if (result.scriptsInvalid.length) {
                        var label = new ui.Label({ text: 'Validation Errors:' });
                        label.class.add('title');
                        panelErrors.append(label);

                        for(var i = 0; i < result.scriptsInvalid.length; i++) {
                            var label = new ui.Label({ text: result.scriptsInvalid[i] });
                            panelErrors.append(label);
                        }
                        panelErrors.hidden = false;
                    } else {
                        panelErrors.hidden = true;
                    }

                    // template attributes validation errors
                    for(var key in result.scripts) {
                        if (! result.scripts.hasOwnProperty(key) || ! scriptsPanelIndex[key])
                            continue;

                        var attrInvalid = result.scripts[key].attributesInvalid;
                        var validation = scriptsPanelIndex[key].validation;

                        if (attrInvalid.length === 0) {
                            validation.clear();
                            if (validation.collision) {
                                validation.append(validation.collision);
                                validation.hidden = false;
                            } else {
                                validation.hidden = true;
                            }
                            continue;
                        }

                        validation.clear();
                        if (validation.collision)
                            validation.append(validation.collision)

                        for(var i = 0; i < attrInvalid.length; i++)
                            validation.append(new ui.Label({ text: attrInvalid[i] }));

                        validation.hidden = false;
                    }
                });
            });
            panelScripts.headerAppend(btnParse);


            // has loading script
            var fieldLoading = new ui.Label({
                text: 'Has Loading Script'
            });
            fieldLoading.class.add('loading');
            fieldLoading.hidden = ! asset.get('data.loading');
            panelScripts.append(fieldLoading);
            events.push(asset.on('data.loading:set', function(value) {
                fieldLoading.hidden = ! value;
                checkScriptsEmpty();
            }));


            // scripts validation errors
            var panelErrors = new ui.Panel();
            panelErrors.class.add('validation');
            panelErrors.hidden = true;
            panelScripts.append(panelErrors);


            // scripts panel
            var panelScriptsList = new ui.Panel();
            panelScriptsList.class.add('scripts');
            panelScripts.append(panelScriptsList);


            var scriptsPanelIndex = { };
            var noScriptsLabel;

            var checkScriptsEmpty = function() {
                var empty = Object.keys(scriptsPanelIndex).length === 0;

                if (empty) {
                    panelScriptsList.class.add('empty');
                } else {
                    panelScriptsList.class.remove('empty');
                }

                if (empty && ! noScriptsLabel && fieldLoading.hidden) {
                    // no scripts
                    noScriptsLabel = new ui.Label({
                        text: 'No Script Objects found'
                    });
                    panelScriptsList.append(noScriptsLabel);
                } else if (! empty && noScriptsLabel) {
                    noScriptsLabel.destroy();
                    noScriptsLabel = null;
                }
            };

            var createScriptPanel = function(script) {
                if (scriptsPanelIndex[script])
                    return;

                var events = [ ];

                var panel = new ui.Panel();
                panel.class.add('script');
                panel.header = script;
                panel.attributesIndex = { };
                panelScriptsList.append(panel);

                var validation = new ui.Panel();
                validation.class.add('validation');
                validation.hidden = true;
                panel.validation = validation;
                panel.append(validation);

                var onCollide = function() {
                    if (validation.collision)
                        return;

                    validation.collision = new ui.Label({
                        text: 'script \'' + script + '\' is already defined in other asset'
                    });
                    validation.append(validation.collision);
                    validation.hidden = false;
                };

                events.push(editor.on('assets[' + asset.get('id') + ']:scripts[' + script + ']:collide', onCollide));

                events.push(editor.on('assets[' + asset.get('id') + ']:scripts[' + script + ']:resolve', function() {
                    if (! validation.collision)
                        return;

                    validation.collision.destroy();
                    if (! validation.innerElement.childNodes.firstChild)
                        validation.hidden = true;

                    validation.collision = null;
                }));

                if (editor.call('assets:scripts:collide', script))
                    onCollide();

                panel.once('destroy', function() {
                    for(var i = 0; i < events.length; i++)
                        events[i].unbind();
                    events = null;
                });

                scriptsPanelIndex[script] = panel;

                var attributesOrder = asset.get('data.scripts.' + script + '.attributesOrder');
                for(var i = 0; i < attributesOrder.length; i++)
                    createScriptAttribute(script, attributesOrder[i]);

                checkScriptsEmpty();
            };

            var createScriptAttribute = function(script, attr, ind) {
                var events = [ ];
                var panel = scriptsPanelIndex[script];
                if (! panel) return;

                if (panel.attributesIndex[attr])
                    return;

                var attribute = asset.get('data.scripts.' + script + '.attributes.' + attr);
                if (! attribute)
                    return;

                var panelAttribute = new ui.Panel();
                panelAttribute.class.add('attr');
                panelAttribute.updatingTooltip = null;
                panelAttribute.updateTooltip = function() {
                    panelAttribute.updatingTooltip = false;

                    var attribute = asset.get('data.scripts.' + script + '.attributes.' + attr);
                    if (! attribute)
                        return;

                    var subTitle = editor.call('assets:scripts:typeToSubTitle', attribute);

                    fieldType.text = subTitle;

                    tooltip.html = editor.call('attributes:reference:template', {
                        title: attr,
                        subTitle: subTitle,
                        description: (attribute.description || attribute.title || ''),
                        code: JSON.stringify(attribute, null, 4)
                    });
                };
                panel.attributesIndex[attr] = panelAttribute;

                var before = null;
                if (typeof(ind) === 'number')
                    before = panel.innerElement.childNodes[ind];

                if (before) {
                    panel.appendBefore(panelAttribute, before);
                } else {
                    panel.append(panelAttribute);
                }

                var fieldName = panelAttribute.fieldName = new ui.Label({ text: attr });
                fieldName.class.add('name');
                panelAttribute.append(fieldName);

                var fieldType = panelAttribute.fieldType = new ui.Label({
                    text: editor.call('assets:scripts:typeToSubTitle', attribute)
                });
                fieldType.class.add('type');
                panelAttribute.append(fieldType);

                var tooltip = editor.call('attributes:reference', {
                    title: attr,
                    subTitle: editor.call('assets:scripts:typeToSubTitle', attribute),
                    description: (attribute.description || attribute.title || ''),
                    code: JSON.stringify(attribute, null, 4)
                });
                tooltip.attach({
                    target: panelAttribute,
                    element: panelAttribute.element
                });

                events.push(asset.on('*:set', function(path) {
                    if (panelAttribute.updatingTooltip)
                        return;

                    if (! path.startsWith('data.scripts.' + script + '.attributes.' + attr))
                        return;

                    panelAttribute.updatingTooltip = true;
                    setTimeout(panelAttribute.updateTooltip, 0);
                }));

                fieldType.once('destroy', function() {
                    for(var i = 0; i < events.length; i++)
                        events[i].unbind();

                    events = null;
                });
            };

            var data = asset.get('data.scripts');
            var scriptKeys = [ ];
            for(var key in data) {
                if (! data.hasOwnProperty(key))
                    continue;

                createScriptPanel(key);
            }

            checkScriptsEmpty();

            events.push(asset.on('*:set', function(path, value) {
                if (! path.startsWith('data.scripts'))
                    return;

                var parts = path.split('.');

                if (parts.length === 3) {
                    // data.scripts.*
                    createScriptPanel(parts[2]);
                } else if (parts.length >= 6 && parts[3] === 'attributes') {
                    // data.scripts.*.attributes.*.**
                    var script = scriptsPanelIndex[parts[2]];
                    if (! script) return;

                    var attr = script.attributesIndex[parts[4]];
                    if (! attr || attr.updatingTooltip) return;

                    attr.updatingTooltip = true;
                    setTimeout(attr.updateTooltip, 0);
                }
            }));

            events.push(asset.on('*:unset', function(path, value) {
                if (! path.startsWith('data.scripts'))
                    return;

                var parts = path.split('.');

                if (parts.length === 3) {
                    // data.scripts.*
                    if (scriptsPanelIndex[parts[2]]) {
                        scriptsPanelIndex[parts[2]].destroy();
                        delete scriptsPanelIndex[parts[2]];
                        checkScriptsEmpty();
                    }
                } else if (parts.length >= 6 && parts[3] === 'attributes') {
                    // data.scripts.*.attributes.*.**
                    var script = scriptsPanelIndex[parts[2]];
                    if (! script) return;

                    var attr = script.attributesIndex[parts[4]];
                    if (! attr || attr.updatingTooltip) return;

                    attr.updatingTooltip = true;
                    setTimeout(attr.updateTooltip, 0);
                }
            }));

            events.push(asset.on('*:insert', function(path, value, ind) {
                if (! path.startsWith('data.scripts'))
                    return;

                var parts = path.split('.');

                if (parts.length === 4 && parts[3] === 'attributesOrder') {
                    // data.scripts.*.attributesOrder
                    createScriptAttribute(parts[2], value, ind + 1);
                }
            }));

            events.push(asset.on('*:remove', function(path, value) {
                if (! path.startsWith('data.scripts'))
                    return;

                var parts = path.split('.');

                if (parts.length === 4 && parts[3] === 'attributesOrder') {
                    // data.scripts.*.attributesOrder
                    var script = scriptsPanelIndex[parts[2]];
                    if (! script) return;

                    var attr = script.attributesIndex[value];
                    if (! attr) return;

                    attr.destroy();
                    delete script.attributesIndex[value];
                }
            }));

            events.push(asset.on('*:move', function(path, value, ind, indOld) {
                if (! path.startsWith('data.scripts'))
                    return;

                var parts = path.split('.');

                if (parts.length === 4 && parts[3] === 'attributesOrder') {
                    var script = scriptsPanelIndex[parts[2]];
                    if (! script) return;

                    var attr = script.attributesIndex[value];
                    if (! attr) return;

                    var parent = attr.element.parentNode;
                    parent.removeChild(attr.element);

                    var next = parent.children[ind + 1];
                    if (next) {
                        parent.insertBefore(attr.element, next);
                    } else {
                        parent.appendChild(attr.element);
                    }
                }
            }));
        }

        // clear events
        panel.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();

            events = null;
        });
    });
});



