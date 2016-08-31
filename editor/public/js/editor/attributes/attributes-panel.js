editor.once('load', function() {
    'use strict';

    var legacyScripts = editor.call('project:settings').get('use_legacy_scripts');
    var title = 'INSPECTOR';
    var root = editor.call('layout.right');
    root.header = title;

    var clearPanel = function() {
        root.clear();
        editor.emit('attributes:clear');
    };

    // clearing
    editor.method('attributes:clear', clearPanel);

    // get current inspected items
    editor.method('attributes:items', function() {
        var type = editor.call('selector:type');
        var items = editor.call('selector:items');
        return {
            type: type,
            items: items
        };
    });

    // set header
    editor.method('attributes:header', function(text) {
        root.header = text;
    });

    // return root panel
    editor.method('attributes.rootPanel', function() {
        return root;
    });

    // add panel
    editor.method('attributes:addPanel', function(args) {
        args = args || { };

        // panel
        var panel = new ui.Panel(args.name || '');
        // parent
        (args.parent || root).append(panel);

        // folding
        panel.foldable = args.foldable || args.folded;
        panel.folded = args.folded;

        return panel;
    });

    var historyState = function(item, state) {
        if (item.history !== undefined) {
            if (typeof(item.history) === 'boolean') {
                item.history = state;
            } else {
                item.history.enabled = state;
            }
        } else {
            if (item._parent && item._parent.history !== undefined) {
                item._parent.history.enabled = state;
            }
        }
    };

    editor.method('attributes:linkField', function(args) {
        var update, changeField, changeFieldQueue;
        args.field._changing = false;
        var events = [ ];

        if (! (args.link instanceof Array))
            args.link = [ args.link ];

        update = function() {
            var different = false;
            var value = args.link[0].has(args.path) ? args.link[0].get(args.path) : undefined;
            if (args.type === 'rgb') {
                if (value) {
                    for(var i = 1; i < args.link.length; i++) {
                        if (! value.equals(args.link[i].get(args.path))) {
                            value = null;
                            different = true;
                            break;
                        }
                    }
                }
                if (value) {
                    value = value.map(function(v) {
                        return Math.floor(v * 255);
                    });
                }
            } else if (args.type === 'asset') {
                var countUndefined = value === undefined ? 1 : 0;
                for(var i = 1; i < args.link.length; i++) {
                    if (!args.link[i].has(args.path)) {
                        countUndefined++;
                        continue;
                    }

                    var val = args.link[i].get(args.path);

                    if ((value || 0) !== (args.link[i].get(args.path) || 0)) {
                        if (value !== undefined) {
                            value = args.enum ? '' : null;
                            different = true;
                            break;
                        }
                    }

                    value = val;
                }

                if (countUndefined && countUndefined != args.link.length) {
                    args.field.class.add('star');
                    if (! /^\* /.test(args.field._title.text))
                        args.field._title.text = '* ' + args.field._title.text;
                } else {
                    args.field.class.remove('star');
                    if (/^\* /.test(args.field._title.text))
                        args.field._title.text = args.field._title.text.substring(2);
                }

                if (different) {
                    args.field.class.add('null');
                    args.field._title.text = 'various';
                } else {
                    args.field.class.remove('null');
                }
            } else if (args.type === 'entity' || ! args.type) {
                for(var i = 1; i < args.link.length; i++) {
                    if (value !== args.link[i].get(args.path)) {
                        value = 'various';
                        different = true;
                        break;
                    }
                }
                if (different) {
                    args.field.class.add('null');
                    args.field.text = 'various';
                } else {
                    args.field.class.remove('null');
                }
            } else {
                var valueFound = false;
                for(var i = 0; i < args.link.length; i++) {
                    if (! args.link[i].has(args.path))
                        continue;

                    if (! valueFound) {
                        valueFound = true;
                        value = args.link[i].get(args.path);
                    } else {
                        var v = args.link[i].get(args.path);
                        if ((value || 0) !== (v || 0)) {
                            value = args.enum ? '' : null;
                            different = true;
                            break;
                        }
                    }
                }
            }

            args.field._changing = true;
            args.field.value = value;

            if (args.type === 'checkbox')
                args.field._onLinkChange(value);

            args.field._changing = false;

            if (args.enum) {
                var opt = args.field.optionElements[''];
                if (opt) opt.style.display = value !== '' ? 'none' : '';
            } else {
                args.field.proxy = value == null ? '...' : null;
            }
        };

        changeField = function(value) {
            if (args.field._changing)
                return;

            if (args.enum) {
                var opt = this.optionElements[''];
                if (opt) opt.style.display = value !== '' ? 'none' : '';
            } else {
                this.proxy = value === null ? '...' : null;
            }

            if (args.trim)
                value = value.trim();

            if (args.type === 'rgb') {
                value = value.map(function(v) {
                    return v / 255;
                });
            } else if (args.type === 'asset') {
                args.field.class.remove('null');
            }

            var items = [ ];

            // set link value
            args.field._changing = true;
            if (args.type === "string" && args.trim)
                args.field.value = value;

            for(var i = 0; i < args.link.length; i++) {
                if (! args.link[i].has(args.path)) continue;

                items.push({
                    get: args.link[i].history !== undefined ? args.link[i].history._getItemFn : null,
                    item: args.link[i],
                    value: args.link[i].has(args.path) ? args.link[i].get(args.path) : undefined
                });

                historyState(args.link[i], false);
                args.link[i].set(args.path, value);
                historyState(args.link[i], true);
            }
            args.field._changing = false;

            // history
            if (args.type !== 'rgb' && ! args.slider && ! args.field._stopHistory) {
                editor.call('history:add', {
                    name: args.path,
                    undo: function() {
                        var different = false;
                        for(var i = 0; i < items.length; i++) {
                            var item;
                            if (items[i].get) {
                                item = items[i].get();
                                if (! item)
                                    continue;
                            } else {
                                item = items[i].item;
                            }

                            if (! different && items[0].value !== items[i].value)
                                different = true;

                            historyState(item, false);
                            if (items[i].value === undefined)
                                item.unset(args.path);
                            else
                                item.set(args.path, items[i].value);
                            historyState(item, true);
                        }

                        if (different) {
                            args.field.class.add('null');
                        } else {
                            args.field.class.remove('null');
                        }
                    },
                    redo: function() {
                        for(var i = 0; i < items.length; i++) {
                            var item;
                            if (items[i].get) {
                                item = items[i].get();
                                if (! item)
                                    continue;
                            } else {
                                item = items[i].item;
                            }

                            historyState(item, false);
                            if (value === undefined)
                                item.unset(args.path);
                            else
                                item.set(args.path, value);
                            item.set(args.path, value);
                            historyState(item, true);
                        }

                        args.field.class.remove('null');
                    }
                });
            }
        };

        changeFieldQueue = function() {
            if (args.field._changing)
                return;

            args.field._changing = true;
            setTimeout(function() {
                args.field._changing = false;
                update();
            }, 0);
        };

        var historyStart, historyEnd;

        if (args.type === 'rgb' || args.slider) {
            historyStart = function() {
                var items = [ ];

                for(var i = 0; i < args.link.length; i++) {
                    var v = args.link[i].get(args.path);
                    if (v instanceof Array)
                        v = v.slice(0);

                    items.push({
                        get: args.link[i].history !== undefined ? args.link[i].history._getItemFn : null,
                        item: args.link[i],
                        value: v
                    });
                }

                return items;
            };

            historyEnd = function(items, value) {
                // history
                editor.call('history:add', {
                    name: args.path,
                    undo: function() {
                        for(var i = 0; i < items.length; i++) {
                            var item;
                            if (items[i].get) {
                                item = items[i].get();
                                if (! item)
                                    continue;
                            } else {
                                item = items[i].item;
                            }

                            historyState(item, false);
                            item.set(args.path, items[i].value);
                            historyState(item, true);
                        }
                    },
                    redo: function() {
                        for(var i = 0; i < items.length; i++) {
                            var item;
                            if (items[i].get) {
                                item = items[i].get();
                                if (! item)
                                    continue;
                            } else {
                                item = items[i].item;
                            }

                            historyState(item, false);
                            item.set(args.path, value);
                            historyState(item, true);
                        }
                    }
                });
            };
        }

        if (args.type === 'rgb') {
            var colorPickerOn = false;
            args.field.on('click', function() {
                colorPickerOn = true;

                // set picker color
                editor.call('picker:color', args.field.value);

                var items = [ ];

                // picking starts
                var evtColorPickStart = editor.on('picker:color:start', function() {
                    items = historyStart();
                });

                // picked color
                var evtColorPick = editor.on('picker:color', function(color) {
                    args.field.value = color;
                });

                var evtColorPickEnd = editor.on('picker:color:end', function() {
                    historyEnd(items.slice(0), args.field.value.map(function(v) {
                        return v / 255;
                    }));
                });

                // position picker
                var rectPicker = editor.call('picker:color:rect');
                var rectField = args.field.element.getBoundingClientRect();
                editor.call('picker:color:position', rectField.left - rectPicker.width, rectField.top);

                // color changed, update picker
                var evtColorToPicker = args.field.on('change', function() {
                    editor.call('picker:color:set', this.value);
                });

                // picker closed
                editor.once('picker:color:close', function() {
                    evtColorPick.unbind();
                    evtColorPickStart.unbind();
                    evtColorPickEnd.unbind();
                    evtColorToPicker.unbind();
                    colorPickerOn = false;
                    args.field.element.focus();
                });
            });

            // close picker if field destroyed
            args.field.once('destroy', function() {
                if (colorPickerOn)
                    editor.call('picker:color:close');
            });
        } else if (args.slider) {
            var sliderRecords;

            events.push(args.field.on('start', function() {
                sliderRecords = historyStart();
            }));

            events.push(args.field.on('end', function() {
                historyEnd(sliderRecords.slice(0), args.field.value);
            }));
        }

        update();
        args.field.on('change', changeField);

        for(var i = 0; i < args.link.length; i++) {
            events.push(args.link[i].on(args.path + ':set', changeFieldQueue));
            events.push(args.link[i].on(args.path + ':unset', changeFieldQueue));
        }

        args.field.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });

    // add field
    editor.method('attributes:addField', function(args) {
        var panel = args.panel;

        if (! panel) {
            panel = new ui.Panel();
            panel.flexWrap = 'nowrap';
            panel.WebkitFlexWrap = 'nowrap';
            panel.style.display = '';

            if (args.type) {
                panel.class.add('field-' + args.type);
            } else {
                panel.class.add('field');
            }

            (args.parent || root).append(panel);
        }

        if (args.name) {
            var label = new ui.Label({
                text: args.name
            });
            label.class.add('label-field');
            panel._label = label;
            panel.append(label);

            if (args.reference) {
                var tooltip = label._tooltip = editor.call('attributes:reference', {
                    element: label.element,
                    title: args.reference.title,
                    subTitle: args.reference.subTitle,
                    description: args.reference.description
                });

                tooltip.attach({
                    target: label,
                    element: label.element
                });
            }
        }

        var field;

        var linkField = function() {
            if (args.link) {
                var link = function(field, path) {
                    editor.call('attributes:linkField', {
                        field: field,
                        path: path || args.path,
                        type: args.type,
                        slider: args.slider,
                        enum: args.enum,
                        link: args.link,
                        trim: args.trim
                    });
                };
                if (field instanceof Array) {
                    for(var i = 0; i < field.length; i++) {
                        link(field[i], args.path + '.' + i);
                    }
                } else {
                    link(field);
                }
            }
        };

        switch(args.type) {
            case 'string':
                if (args.enum) {
                    field = new ui.SelectField({
                        options: args.enum
                    });
                } else {
                    field = new ui.TextField();
                }

                field.value = args.value || '';
                field.flexGrow = 1;

                if (args.placeholder)
                    field.placeholder = args.placeholder;

                linkField();

                panel.append(field);
                break;

            case 'strings':
                var innerPanel = new ui.Panel();
                innerPanel.flex = true;
                innerPanel.flexGrow = 1;

                var events = [ ];

                field = new ui.TextField();
                field.renderChanges = false;
                innerPanel.append(field);

                field.element.addEventListener('keydown', function(evt) {
                    if (evt.keyCode !== 13 || ! field.value)
                        return;

                    addTag(field.value.trim());
                    field.value = '';
                });

                var btnAdd = new ui.Button({
                    text: '&#57632'
                });
                btnAdd.flexGrow = 0;
                btnAdd.on('click', function() {
                    if (! field.value)
                        return;

                    addTag(field.value.trim());
                    field.value = '';
                });
                innerPanel.append(btnAdd);

                var tagItems = { };
                var tagIndex = { };
                var tagList = [ ];

                var onRemoveClick = function() {
                    if (innerPanel.disabled)
                        return;

                    removeTag(this.tag);
                };

                var removeTag = function(tag) {
                    if (! tag || ! tagIndex.hasOwnProperty(tag))
                        return;

                    var records = [ ];

                    for(var i = 0; i < link.length; i++) {
                        if (link[i].get(args.path).indexOf(tag) === -1)
                            continue;

                        records.push({
                            get: link[i].history !== undefined ? link[i].history._getItemFn : null,
                            item: link[i],
                            path: args.path,
                            value: tag
                        });

                        historyState(link[i], false);
                        link[i].removeValue(args.path, tag);
                        historyState(link[i], true);
                    }

                    editor.call('history:add', {
                        name: args.path,
                        undo: function() {
                            for(var i = 0; i < records.length; i++) {
                                var item;
                                if (records[i].get) {
                                    item = records[i].get();
                                    if (! item)
                                        continue;
                                } else {
                                    item = records[i].item;
                                }

                                historyState(item, false);
                                item.insert(records[i].path, records[i].value);
                                historyState(item, true);
                            }
                        },
                        redo: function() {
                            for(var i = 0; i < records.length; i++) {
                                var item;
                                if (records[i].get) {
                                    item = records[i].get();
                                    if (! item)
                                        continue;
                                } else {
                                    item = records[i].item;
                                }

                                historyState(item, false);
                                item.removeValue(records[i].path, records[i].value);
                                historyState(item, true);
                            }
                        }
                    });
                };

                var addTag = function(tag) {
                    var records = [ ];

                    for(var i = 0; i < link.length; i++) {
                        if (link[i].get(args.path).indexOf(tag) !== -1)
                            continue;

                        records.push({
                            get: link[i].history !== undefined ? link[i].history._getItemFn : null,
                            item: link[i],
                            path: args.path,
                            value: tag
                        });

                        historyState(link[i], false);
                        link[i].insert(args.path, tag);
                        historyState(link[i], true);
                    }

                    editor.call('history:add', {
                        name: args.path,
                        undo: function() {
                            for(var i = 0; i < records.length; i++) {
                                var item;
                                if (records[i].get) {
                                    item = records[i].get();
                                    if (! item)
                                        continue;
                                } else {
                                    item = records[i].item;
                                }

                                historyState(item, false);
                                item.removeValue(records[i].path, records[i].value);
                                historyState(item, true);
                            }
                        },
                        redo: function() {
                            for(var i = 0; i < records.length; i++) {
                                var item;
                                if (records[i].get) {
                                    item = records[i].get();
                                    if (! item)
                                        continue;
                                } else {
                                    item = records[i].item;
                                }

                                historyState(item, false);
                                item.insert(records[i].path, records[i].value);
                                historyState(item, true);
                            }
                        }
                    });
                };

                var onInsert = function(tag) {
                    if (! tagIndex.hasOwnProperty(tag)) {
                        tagIndex[tag] = 0;
                        tagList.push(tag);
                    }

                    tagIndex[tag]++;
                    insertElement(tag);
                };

                var onRemove = function(tag) {
                    if (! tagIndex[tag])
                        return;

                    tagIndex[tag]--;

                    if (! tagIndex[tag]) {
                        innerPanel.innerElement.removeChild(tagItems[tag]);
                        var ind = tagList.indexOf(tag);
                        if (ind !== -1)
                            tagList.splice(ind, 1);

                        delete tagItems[tag];
                        delete tagIndex[tag];
                    } else {
                        if (tagIndex[tag] === link.length) {
                            tagItems[tag].classList.remove('partial');
                        } else {
                            tagItems[tag].classList.add('partial');
                        }
                    }
                };

                var insertElement = function(tag) {
                    if (! tagItems[tag]) {
                        sortTags();

                        var item = document.createElement('div');
                        tagItems[tag] = item;
                        item.classList.add('tag');
                        item.textContent = tag;

                        var icon = document.createElement('span');
                        icon.innerHTML = '&#57650;';
                        icon.classList.add('icon');
                        icon.tag = tag;
                        icon.addEventListener('click', onRemoveClick, false);
                        item.appendChild(icon);

                        var ind = tagList.indexOf(tag);
                        if (tagItems[tagList[ind + 1]]) {
                            innerPanel.appendBefore(item, tagItems[tagList[ind + 1]]);
                        } else {
                            innerPanel.append(item);
                        }
                    }

                    if (tagIndex[tag] === link.length) {
                        tagItems[tag].classList.remove('partial');
                    } else {
                        tagItems[tag].classList.add('partial');
                    }
                };

                var sortTags = function() {
                    tagList.sort(function(a, b) {
                        if (a > b) {
                            return 1;
                        } else if (a < b) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });
                };

                if (args.placeholder)
                    field.placeholder = args.placeholder;

                // list
                var link = args.link;
                if (! (args.link instanceof Array))
                    link = [ link ];

                for(var i = 0; i < link.length; i++) {
                    var tags = link[i].get(args.path);

                    events.push(link[i].on(args.path + ':insert', onInsert));
                    events.push(link[i].on(args.path + ':remove', onRemove));

                    if (! tags)
                        continue;

                    for(var t = 0; t < tags.length; t++) {
                        if (! tags[t])
                            continue;

                        if (! tagIndex.hasOwnProperty(tags[t])) {
                            tagIndex[tags[t]] = 0;
                            tagList.push(tags[t]);
                        }

                        tagIndex[tags[t]]++;
                    }
                }

                sortTags();

                for(var i = 0; i < tagList.length; i++)
                    insertElement(tagList[i]);

                panel.once('destroy', function() {
                    for(var i = 0; i < events.length; i++)
                        events[i].unbind();
                });

                panel.append(innerPanel);
                break;

            case 'number':
                if (args.enum) {
                    field = new ui.SelectField({
                        options: args.enum,
                        type: 'number'
                    });
                } else if (args.slider) {
                    field = new ui.Slider();
                } else {
                    field = new ui.NumberField();
                }

                field.value = args.value || 0;
                field.flexGrow = 1;
                if (args.placeholder)
                    field.placeholder = args.placeholder;

                if (args.precision != null)
                    field.precision = args.precision;

                if (args.step != null)
                    field.step = args.step;

                if (args.min != null)
                    field.min = args.min;

                if (args.max != null)
                    field.max = args.max;

                linkField();

                panel.append(field);
                break;

            case 'checkbox':
                if (args.enum) {
                    field = new ui.SelectField({
                        options: args.enum,
                        type: 'boolean'
                    });
                    field.flexGrow = 1;
                } else {
                    field = new ui.Checkbox();
                }

                field.value = args.value || 0;
                field.class.add('tick');

                linkField();

                panel.append(field);
                break;

            case 'vec2':
            case 'vec3':
            case 'vec4':
                var channels = parseInt(args.type[3], 10);
                field = [ ];

                for(var i = 0; i < channels; i++) {
                    field[i] = new ui.NumberField();
                    field[i].flexGrow = 1;
                    field[i].style.width = '24px';
                    field[i].value = (args.value && args.value[i]) || 0;
                    panel.append(field[i]);

                    if (args.placeholder)
                        field[i].placeholder = args.placeholder[i];

                    if (args.precision != null)
                        field[i].precision = args.precision;

                    if (args.step != null)
                        field[i].step = args.step;

                    if (args.min != null)
                        field[i].min = args.min;

                    if (args.max != null)
                        field[i].max = args.max;

                    // if (args.link)
                    //     field[i].link(args.link, args.path + '.' + i);
                }

                linkField();
                break;

            case 'rgb':
                field = new ui.ColorField();

                linkField();

                var colorPickerOn = false;
                field.on('click', function() {
                    colorPickerOn = true;
                    var first = true;

                    // set picker color
                    editor.call('picker:color', field.value);

                    // picking starts
                    var evtColorPickStart = editor.on('picker:color:start', function() {
                        first = true;
                    });

                    // picked color
                    var evtColorPick = editor.on('picker:color', function(color) {
                        first = false;
                        field.value = color;
                    });

                    // position picker
                    var rectPicker = editor.call('picker:color:rect');
                    var rectField = field.element.getBoundingClientRect();
                    editor.call('picker:color:position', rectField.left - rectPicker.width, rectField.top);

                    // color changed, update picker
                    var evtColorToPicker = field.on('change', function() {
                        editor.call('picker:color:set', this.value);
                    });

                    // picker closed
                    editor.once('picker:color:close', function() {
                        evtColorPick.unbind();
                        evtColorPickStart.unbind();
                        evtColorToPicker.unbind();
                        colorPickerOn = false;
                        field.element.focus();
                    });
                });

                // close picker if field destroyed
                field.on('destroy', function() {
                    if (colorPickerOn)
                        editor.call('picker:color:close');
                });

                panel.append(field);
                break;

            case 'asset':
                field = new ui.ImageField();
                var evtPick;

                label.renderChanges = false;
                field._label = label;

                label.style.width = '32px';
                label.flexGrow = 1;

                var panelFields = document.createElement('div');
                panelFields.classList.add('top');

                var panelControls = document.createElement('div');
                panelControls.classList.add('controls');

                var fieldTitle = field._title = new ui.Label();
                fieldTitle.text = 'Empty';
                fieldTitle.parent = panel;
                fieldTitle.flexGrow = 1;
                fieldTitle.placeholder = '...';

                var btnEdit = new ui.Button({
                    text: '&#57648;'
                });
                btnEdit.disabled = true;
                btnEdit.parent = panel;
                btnEdit.flexGrow = 0;

                var btnRemove = new ui.Button({
                    text: '&#57650;'
                });
                btnRemove.disabled = true;
                btnRemove.parent = panel;
                btnRemove.flexGrow = 0;

                fieldTitle.on('click', function() {
                    var asset = editor.call('assets:get', field.value);
                    editor.call('picker:asset', args.kind, asset);

                    evtPick = editor.once('picker:asset', function(asset) {
                        if (args.onSet) args.onSet(asset);
                        field.emit('beforechange', asset.get('id'));
                        field.value = asset.get('id');
                        evtPick = null;
                    });

                    editor.once('picker:asset:close', function() {
                        if (evtPick) {
                            evtPick.unbind();
                            evtPick = null;
                        }
                        field.element.focus();
                    });
                });

                field.on('click', function() {
                    if (! this.value)
                        return;

                    var asset = editor.call('assets:get', this.value);
                    if (! asset) return;
                    editor.call('selector:set', 'asset', [ asset ]);

                    if (legacyScripts && asset.get('type') === 'script') {
                        editor.call('assets:panel:currentFolder', 'scripts');
                    } else {
                        var path = asset.get('path');
                        if (path.length) {
                            editor.call('assets:panel:currentFolder', editor.call('assets:get', path[path.length - 1]));
                        } else {
                            editor.call('assets:panel:currentFolder', null);
                        }
                    }
                });
                btnEdit.on('click', function() {
                    field.emit('click');
                });

                btnRemove.on('click', function() {
                    field.emit('beforechange', null);
                    field.value = null;
                });

                var evtThumbnailChange;
                var updateThumbnail = function() {
                    var asset = editor.call('assets:get', field.value);

                    if (! asset) {
                        return field.image = config.url.home + '/editor/scene/img/asset-placeholder-texture.png';
                    } else {
                        if (asset.has('thumbnails.m')) {
                            var src = asset.get('thumbnails.m');
                            if (src.startsWith('data:image/png;base64')) {
                                field.image = asset.get('thumbnails.m');
                            } else {
                                field.image = config.url.home + asset.get('thumbnails.m') + '?t=' + asset.get('file.hash');
                            }
                        } else {
                            field.image = '/editor/scene/img/asset-placeholder-' + asset.get('type') + '.png';
                        }
                    }
                };

                linkField();

                var updateField = function() {
                    var value = field.value;

                    fieldTitle.text = field.class.contains('null') ? 'various' : 'Empty';

                    btnEdit.disabled = ! value;
                    btnRemove.disabled = ! value && ! field.class.contains('null');

                    if (evtThumbnailChange) {
                        evtThumbnailChange.unbind();
                        evtThumbnailChange = null;
                    }

                    if (! value) {
                        if (field.class.contains('star'))
                            fieldTitle.text = '* ' + fieldTitle.text;

                        return field.empty = true;
                    }

                    field.empty = false;

                    var asset = editor.call('assets:get', value);

                    if (! asset)
                        return field.image = config.url.home + '/editor/scene/img/asset-placeholder-texture.png';

                    evtThumbnailChange = asset.on('file.hash.m:set', updateThumbnail);
                    updateThumbnail();

                    fieldTitle.text = asset.get('name');

                    if (field.class.contains('star'))
                        fieldTitle.text = '* ' + fieldTitle.text;
                };
                field.on('change', updateField);

                if (args.value)
                    field.value = args.value;

                updateField();

                var dropRef = editor.call('drop:target', {
                    ref: panel.element,
                    filter: function(type, data) {
                        var rectA = root.innerElement.getBoundingClientRect();
                        var rectB = panel.element.getBoundingClientRect();
                        return (args.kind === '*' || type === 'asset.' + args.kind) && parseInt(data.id, 10) !== field.value && ! editor.call('assets:get', parseInt(data.id, 10)).get('source') && rectB.top > rectA.top && rectB.bottom < rectA.bottom;
                    },
                    drop: function(type, data) {
                        if ((args.kind !== '*' && type !== 'asset.' + args.kind) || editor.call('assets:get', parseInt(data.id, 10)).get('source'))
                            return;

                        if (args.onSet) {
                            var asset = editor.call('assets:get', parseInt(data.id, 10));
                            if (asset) args.onSet(asset);
                        }

                        field.emit('beforechange', parseInt(data.id, 10));
                        field.value = parseInt(data.id, 10);
                    },
                    over: function(type, data) {
                        if (args.over)
                            args.over(type, data);
                    },
                    leave: function() {
                        if (args.leave)
                            args.leave();
                    }
                });
                field.on('destroy', function() {
                    dropRef.unregister();
                    if (evtThumbnailChange) {
                        evtThumbnailChange.unbind();
                        evtThumbnailChange = null;
                    }
                });

                // thumbnail
                panel.append(field);
                // right side
                panel.append(panelFields);
                // controls
                panelFields.appendChild(panelControls);
                // label
                panel.innerElement.removeChild(label.element);
                panelControls.appendChild(label.element);
                panelControls.classList.remove('label-field');
                // edit
                panelControls.appendChild(btnEdit.element);
                // remove
                panelControls.appendChild(btnRemove.element);

                // title
                panelFields.appendChild(fieldTitle.element);
                break;

            // entity picker
            case 'entity':
                field = new ui.Label();
                field.class.add('add-entity');
                field.flexGrow = 1;
                field.class.add('null');

                field.text = 'Select Entity';
                field.placeholder = '...';

                panel.append(field);

                var icon = document.createElement('span');
                icon.classList.add('icon');

                icon.addEventListener('click', function (e) {
                    e.stopPropagation();

                    if (editor.call('permissions:write'))
                        field.text = '';
                });

                field.on('change', function (value) {
                    if (value) {
                        var entity = editor.call('entities:get', value);
                        if (!entity) {
                            field.text = null;
                            return;
                        }

                        field.element.innerHTML = entity.get('name');
                        field.element.appendChild(icon);
                        field.placeholder = '';

                        if (value !== 'various')
                            field.class.remove('null');
                    } else {
                        field.element.innerHTML = 'Select Entity';
                        field.placeholder = '...';
                        field.class.add('null');
                    }
                });

                linkField();

                var getCurrentEntity = function () {
                    var entity = null;
                    if (args.link) {
                        if (! (args.link instanceof Array)) {
                            args.link = [args.link];
                        }

                        // get initial value only if it's the same for all
                        // links otherwise set it to null
                        for (var i = 0, len = args.link.length; i < len; i++) {
                            var val = args.link[i].get(args.path);
                            if (entity !== val) {
                                if (entity) {
                                    entity = null;
                                    break;
                                } else {
                                    entity = val;
                                }
                            }
                        }
                    }

                    return entity;
                };

                field.on('click', function () {
                    var evtEntityPick = editor.once('picker:entity', function (entity) {
                        field.text = entity ? entity.get('resource_id') : null;
                        evtEntityPick = null;
                    });

                    var initialValue = getCurrentEntity();

                    editor.call('picker:entity', initialValue, args.filter || null);

                    editor.once('picker:entity:close', function () {
                        if (evtEntityPick) {
                            evtEntityPick.unbind();
                            evtEntityPick = null;
                        }
                    });
                });

                // highlight on hover
                field.on('hover', function () {
                    var entity = getCurrentEntity();
                    if (! entity) return;

                    editor.call('entities:panel:highlight', entity, true);

                    field.once('blur', function () {
                        editor.call('entities:panel:highlight', entity, false);
                    });

                    field.once('click', function () {
                        editor.call('entities:panel:highlight', entity, false);
                    });
                });

                var dropRef = editor.call('drop:target', {
                    ref: field.element,
                    filter: function(type, data) {
                        var rectA = root.innerElement.getBoundingClientRect();
                        var rectB = field.element.getBoundingClientRect();
                        return type === 'entity' && data.resource_id !== field.value && rectB.top > rectA.top && rectB.bottom < rectA.bottom;
                    },
                    drop: function(type, data) {
                        if (type !== 'entity')
                            return;

                        field.value = data.resource_id;
                    },
                    over: function(type, data) {
                        if (args.over)
                            args.over(type, data);
                    },
                    leave: function() {
                        if (args.leave)
                            args.leave();
                    }
                });
                field.on('destroy', function() {
                    dropRef.unregister();
                });

                break;
            case 'image':
                panel.flex = false;

                field = new Image();
                field.style.maxWidth = '100%';
                field.style.display = 'block';
                field.src = args.src;

                panel.append(field);
                break;

            case 'progress':
                field = new ui.Progress();
                field.flexGrow = 1;

                panel.append(field);
                break;

            case 'code':
                field = new ui.Code();
                field.flexGrow = 1;

                if (args.value)
                    field.text = args.value;

                panel.append(field);
                break;

            case 'button':
                field = new ui.Button();
                field.flexGrow = 1;
                field.text = args.text || 'Button';
                panel.append(field);
                break;

            case 'element':
                field = args.element;
                panel.append(field);
                break;

            case 'curveset':
                field = new ui.CurveField(args);
                field.flexGrow = 1;
                field.text = args.text || '';

                if (args.link) {
                    var link = args.link;
                    if (args.link instanceof Array)
                        link = args.link[0];

                    field.link(link, args.paths || [args.path]);
                }

                var curvePickerOn = false;

                var toggleCurvePicker = function () {
                    if (!field.class.contains('disabled') && !curvePickerOn) {
                        editor.call('picker:curve', field.value, args);

                        curvePickerOn = true;

                        // position picker
                        var rectPicker = editor.call('picker:curve:rect');
                        var rectField = field.element.getBoundingClientRect();
                        editor.call('picker:curve:position', rectField.right - rectPicker.width, rectField.bottom);

                        args.keepZoom = false;

                        var combine = false;

                        var evtChangeStart = editor.on('picker:curve:change:start', function () {
                            combine = true;
                        });

                        var evtChangeEnd = editor.on('picker:curve:change:end', function () {
                            combine = false;
                        });

                        var evtPickerChanged = editor.on('picker:curve:change', function (paths, values) {
                            if (! field._link) return;

                            var previous = {
                                paths: [],
                                values: []
                            };

                            var path;
                            for (var i = 0, len = paths.length; i < len; i++) {
                                if (args.paths) {
                                    path = args.paths[parseInt(paths[i][0])] + paths[i].substring(1);
                                } else {
                                    path = args.path + paths[i].substring(1);
                                }

                                previous.paths.push(path);
                                previous.values.push(field._link.get(path));
                            }


                            var undo = function () {
                                if (! field._link)
                                    return;

                                args.keepZoom = true;

                                var history = false;
                                if (field._link.history) {
                                    history = field._link.history.enabled;
                                    field._link.history.enabled = false;
                                }

                                for (var i = 0, len = previous.paths.length; i < len; i++) {
                                    field._link.set(previous.paths[i], previous.values[i]);
                                }

                                if (field._link.history)
                                    field._link.history.enabled = history;

                                args.keepZoom = false;
                            };

                            var redo = function () {
                                if (! field._link)
                                    return;

                                args.keepZoom = true;

                                var history = false;
                                if (field._link.history) {
                                    history = field._link.history.enabled;
                                    field._link.history.enabled = false;
                                }

                                for (var i = 0, len = paths.length; i < len; i++) {
                                    if (args.paths) {
                                        path = args.paths[parseInt(paths[i][0])] + paths[i].substring(1);
                                    } else {
                                        path = args.path + paths[i].substring(1);
                                    }

                                    field._link.set(path, values[i]);
                                }

                                if (field._link.history)
                                    field._link.history.enabled = history;

                                args.keepZoom = false;
                            };

                            redo();

                            // add custom history event
                            editor.call('history:' + (combine ? 'update' : 'add'), {
                                name: path + '.curves',
                                undo: undo,
                                redo: redo
                            });

                        });

                        var evtRefreshPicker = field.on('change', function (value) {
                            editor.call('picker:curve:set', value, args);
                        });

                        editor.once('picker:curve:close', function () {
                            evtRefreshPicker.unbind();
                            evtPickerChanged.unbind();
                            evtChangeStart.unbind();
                            evtChangeEnd.unbind();
                            curvePickerOn = false;
                        });
                    }
                };

                // open curve editor on click
                field.on('click', toggleCurvePicker);

                // close picker if field destroyed
                field.on('destroy', function() {
                    if (curvePickerOn) {
                        editor.call('picker:curve:close');
                    }
                });

                panel.append(field);
                break;

            default:
                field = new ui.Label();
                field.flexGrow = 1;
                field.text = args.value || '';

                if (args.placeholder)
                    field.placeholder = args.placeholder;

                linkField();

                panel.append(field);
                break;
        }

        return field;
    });

    editor.method('attributes:addAssetsList', function(args) {
        var link = args.link;
        var title = args.title;
        var assetType = args.type;
        var path = args.path;
        var panel = args.panel;
        var events = [ ];

        // assets
        var fieldAssetsList = new ui.List();
        fieldAssetsList.flexGrow = 1;

        fieldAssetsList.on('select', function(item) {
            if (item === itemAdd || ! item.asset)
                return;

            editor.call('selector:set', 'asset', [ item.asset ]);
        });

        // drop
        var dropRef = editor.call('drop:target', {
            ref: fieldAssetsList.element,
            type: 'asset.' + assetType,
            filter: function(type, data) {
                // type
                if ((assetType && assetType !== '*' && type !== 'asset.' + assetType) || ! type.startsWith('asset') || editor.call('assets:get', parseInt(data.id, 10)).get('source'))
                    return false;

                // overflowed
                var rectA = root.innerElement.getBoundingClientRect();
                var rectB = fieldAssetsList.element.getBoundingClientRect();
                if (rectB.top <= rectA.top || rectB.bottom >= rectA.bottom)
                    return false;

                // already added
                var id = parseInt(data.id, 10);
                for(var i = 0; i < link.length; i++) {
                    if (link[i].get(path).indexOf(id) === -1)
                        return true;
                }

                return false;
            },
            drop: function(type, data) {
                if ((assetType && assetType !== '*' && type !== 'asset.' + assetType) || ! type.startsWith('asset') || editor.call('assets:get', parseInt(data.id, 10)).get('source'))
                    return;

                var records = [ ];

                var id = parseInt(data.id, 10);

                for(var i = 0; i < link.length; i++) {
                    if (link[i].get(path).indexOf(id) !== -1)
                        continue;

                    records.push({
                        get: link[i].history !== undefined ? link[i].history._getItemFn : null,
                        item: link[i],
                        path: path,
                        value: id
                    });

                    historyState(link[i], false);
                    link[i].insert(path, id);
                    historyState(link[i], true);
                }

                editor.call('history:add', {
                    name: path,
                    undo: function() {
                        for(var i = 0; i < records.length; i++) {
                            var item;
                            if (records[i].get) {
                                item = records[i].get();
                                if (! item)
                                    continue;
                            } else {
                                item = records[i].item;
                            }

                            historyState(item, false);
                            item.removeValue(records[i].path, records[i].value);
                            historyState(item, true);
                        }
                    },
                    redo: function() {
                        for(var i = 0; i < records.length; i++) {
                            var item;
                            if (records[i].get) {
                                item = records[i].get();
                                if (! item)
                                    continue;
                            } else {
                                item = records[i].item;
                            }

                            historyState(item, false);
                            item.insert(records[i].path, records[i].value);
                            historyState(item, true);
                        }
                    }
                });
            }
        });
        dropRef.disabled = panel.disabled;
        panel.on('enable', function() {
            dropRef.disabled = false;
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
            name: args.name || 'Assets',
            type: 'element',
            element: fieldAssetsList,
            reference: args.reference
        });
        fieldAssets.class.add('assets');

        // reference assets
        editor.call('attributes:reference:attach', assetType + ':assets', fieldAssets.parent.innerElement.firstChild.ui);

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
            assetId = parseInt(assetId, 10);

            var item = assetIndex[assetId];
            if (item) {
                item.count++;
                item.text = (item.count === link.length ? '' : '* ') + item._assetText;
                return;
            }

            var asset = editor.call('assets:get', assetId);
            var text = assetId;
            if (asset && asset.get('name'))
                text = asset.get('name');

            item = new ui.ListItem({
                text: (link.length === 1) ? text : '* ' + text
            });
            item.count = 1;
            item.asset = asset;
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

                for(var i = 0; i < link.length; i++) {
                    var ind = link[i].get(path).indexOf(assetId);
                    if (ind === -1)
                        continue;

                    records.push({
                        get: link[i].history !== undefined ? link[i].history._getItemFn : null,
                        item: link[i],
                        path: path,
                        value: assetId,
                        ind: ind
                    });

                    historyState(link[i], false);
                    link[i].removeValue(path, assetId);
                    historyState(link[i], true);
                }

                editor.call('history:add', {
                    name: path,
                    undo: function() {
                        for(var i = 0; i < records.length; i++) {
                            var item;
                            if (records[i].get) {
                                item = records[i].get();
                                if (! item)
                                    continue;
                            } else {
                                item = records[i].item;
                            }

                            historyState(item, false);
                            item.insert(records[i].path, records[i].value, records[i].ind);
                            historyState(item, true);
                        }
                    },
                    redo: function() {
                        for(var i = 0; i < records.length; i++) {
                            var item;
                            if (records[i].get) {
                                item = records[i].get();
                                if (! item)
                                    continue;
                            } else {
                                item = records[i].item;
                            }

                            historyState(item, false);
                            item.removeValue(records[i].path, records[i].value);
                            historyState(item, true);
                        }
                    }
                });
            });
            btnRemove.parent = item;
            item.element.appendChild(btnRemove.element);

            item.once('destroy', function() {
                delete assetIndex[assetId];
            });
        };

        var removeAsset = function(assetId) {
            var item = assetIndex[assetId];

            if (! item)
                return;

            item.count--;

            if (item.count === 0) {
                item.destroy();
            } else {
                item.text = (item.count === link.length ? '' : '* ') + item._assetText;
            }
        };

        // on adding new asset
        itemAdd.on('click', function() {
            // call picker
            editor.call('picker:asset', assetType, null);

            // on pick
            var evtPick = editor.once('picker:asset', function(asset) {
                if (legacyScripts && asset.get('type') === 'script')
                    return;

                var records = [ ];
                var assetId = parseInt(asset.get('id'), 10);

                for(var i = 0; i < link.length; i++) {
                    // already in list
                    if (link[i].get(path).indexOf(assetId) !== -1)
                        continue;

                    records.push({
                        get: link[i].history !== undefined ? link[i].history._getItemFn : null,
                        item: link[i],
                        path: path,
                        value: assetId
                    });

                    historyState(link[i], false);
                    link[i].insert(path, assetId);
                    historyState(link[i], true);
                    evtPick = null;
                }

                editor.call('history:add', {
                    name: path,
                    undo: function() {
                        for(var i = 0; i < records.length; i++) {
                            var item;
                            if (records[i].get) {
                                item = records[i].get();
                                if (! item)
                                    continue;
                            } else {
                                item = records[i].item;
                            }

                            historyState(item, false);
                            item.removeValue(records[i].path, records[i].value);
                            historyState(item, true);
                        }
                    },
                    redo: function() {
                        for(var i = 0; i < records.length; i++) {
                            var item;
                            if (records[i].get) {
                                item = records[i].get();
                                if (! item)
                                    continue;
                            } else {
                                item = records[i].item;
                            }

                            historyState(item, false);
                            item.insert(records[i].path, records[i].value);
                            historyState(item, true);
                        }
                    }
                });
            });

            editor.once('picker:asset:close', function() {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        });

        // list
        for(var i = 0; i < link.length; i++) {
            var assets = link[i].get(path);
            if (assets) {
                for(var a = 0; a < assets.length; a++)
                    addAsset(assets[a]);
            }

            events.push(link[i].on(path + ':set', function(assets, assetsOld) {
                if (! (assets instanceof Array))
                    return;

                if (! (assetsOld instanceof Array))
                    assetsOld = [ ];

                var assetIds = { };
                for(var a = 0; a < assets.length; a++)
                    assetIds[assets[a]] = true;

                var assetOldIds = { };
                for(var a = 0; a < assetsOld.length; a++)
                    assetOldIds[assetsOld[a]] = true;

                // remove
                for(var id in assetOldIds) {
                    if (assetIds[id])
                        continue;

                    removeAsset(id);
                }

                // add
                for(var id in assetIds)
                    addAsset(id);
            }));

            events.push(link[i].on(path + ':insert', function(assetId, ind) {
                var before;
                if (ind === 0) {
                    before = itemAdd;
                } else {
                    before = assetIndex[this.get(path + '.' + ind)];
                }
                addAsset(assetId, before);
            }));

            events.push(link[i].on(path + ':remove', removeAsset));
        }

        fieldAssetsList.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });

        return fieldAssetsList;
    });

    var inspectedItems = [ ];

    editor.on('attributes:clear', function() {
        for(var i = 0; i < inspectedItems.length; i++) {
            inspectedItems[i].unbind();
        }
        inspectedItems = [ ];
    });

    editor.method('attributes:inspect', function(type, item) {
        clearPanel();

        // clear if destroyed
        inspectedItems.push(item.once('destroy', function() {
            editor.call('attributes:clear');
        }));

        root.header = type;
        editor.emit('attributes:inspect[' + type + ']', [ item ]);
        editor.emit('attributes:inspect[*]', type, [ item ]);
    });

    editor.on('selector:change', function(type, items) {
        clearPanel();

        // nothing selected
        if (items.length === 0) {
            var label = new ui.Label({ text: 'Select anything to Inspect' });
            label.style.display = 'block';
            label.style.textAlign = 'center';
            root.append(label);

            root.header = title;

            return;
        }

        // clear if destroyed
        for(var i = 0; i < items.length; i++) {
            inspectedItems.push(items[i].once('destroy', function() {
                editor.call('attributes:clear');
            }));
        }

        root.header = type;
        editor.emit('attributes:inspect[' + type + ']', items);
        editor.emit('attributes:inspect[*]', type, items);
    });

    editor.emit('selector:change', null, [ ]);
});
