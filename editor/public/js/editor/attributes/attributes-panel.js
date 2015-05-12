editor.once('load', function() {
    'use strict';

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
        root.header = title + ' (' + text + ')';
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

    editor.method('attributes:linkField', function(args) {
        var update, changeField, changeFieldQueue;
        args.field._changing = false;
        var events = [ ];

        if (! (args.link instanceof Array))
            args.link = [ args.link ];

        update = function() {
            var different = false;
            var value = args.link[0].get(args.path);
            if (args.type === 'rgb') {
                for(var i = 1; i < args.link.length; i++) {
                    if (! value.equals(args.link[i].get(args.path))) {
                        value = null;
                        different = true;
                        break;
                    }
                }
                if (value) {
                    value = value.map(function(v) {
                        return Math.floor(v * 255);
                    });
                }
            } else {
                for(var i = 1; i < args.link.length; i++) {
                    if (value !== args.link[i].get(args.path)) {
                        value = args.enum ? '' : null;
                        different = true;
                        break;
                    }
                }

                if (args.type === 'asset') {
                    if (different) {
                        args.field.class.add('null');
                        args.field._title.text = 'various';
                    } else {
                        args.field.class.remove('null');
                    }
                }
            }

            args.field._changing = true;
            args.field.value = value;
            args.field._changing = false;

            if (args.enum) {
                if (args.field.optionElements[''])
                    args.field.optionElements[''].style.display = value ? 'none' : '';
            } else {
                args.field.proxy = value === null ? '...' : null;
            }
        };

        changeField = function(value) {
            if (args.field._changing)
                return;

            if (args.enum) {
                if (this.optionElements[''])
                    this.optionElements[''].style.display = value ? 'none' : '';
            } else {
                this.proxy = value === null ? '...' : null;
            }

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
            for(var i = 0; i < args.link.length; i++) {
                items.push({
                    get: args.link[i].history._getItemFn,
                    item: args.link[i],
                    value: args.link[i].get(args.path)
                });
                if (typeof(args.link[i].history) === 'boolean') {
                    args.link[i].history = false;
                } else {
                    args.link[i].history.enabled = false;
                }

                args.link[i].set(args.path, value);

                if (typeof(args.link[i].history) === 'boolean') {
                    args.link[i].history = true;
                } else {
                    args.link[i].history.enabled = true;
                }
            }
            args.field._changing = false;

            // history
            if (args.type !== 'rgb') {
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

                            if (typeof(item.history) === 'boolean') {
                                item.history = false;
                            } else {
                                item.history.enabled = false;
                            }

                            item.set(args.path, items[i].value);

                            if (typeof(item.history) === 'boolean') {
                                item.history = true;
                            } else {
                                item.history.enabled = true;
                            }
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

                            if (typeof(item.history) === 'boolean') {
                                item.history = false;
                            } else {
                                item.history.enabled = false;
                            }

                            item.set(args.path, value);

                            if (typeof(item.history) === 'boolean') {
                                item.history = true;
                            } else {
                                item.history.enabled = true;
                            }
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

        if (args.type === 'rgb') {
            var items = [ ];

            events.push(editor.on('picker:color:start', function() {
                args.field._changing = true;
                items = [ ];

                for(var i = 0; i < args.link.length; i++) {
                    items.push({
                        get: args.link[i].history._getItemFn,
                        item: args.link[i],
                        value: args.link[i].get(args.path).slice(0)
                    });
                }
            }));
            events.push(editor.on('picker:color', function() {
                args.field._changing = false;
            }));
            events.push(editor.on('picker:color:end', function() {
                args.field._changing = false;

                var records = items.slice(0);
                var value = args.field.value.map(function(v) {
                    return v / 255;
                });

                // history
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

                            if (typeof(item.history) === 'boolean') {
                                item.history = false;
                            } else {
                                item.history.enabled = false;
                            }

                            item.set(args.path, records[i].value);

                            if (typeof(item.history) === 'boolean') {
                                item.history = true;
                            } else {
                                item.history.enabled = true;
                            }
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

                            if (typeof(item.history) === 'boolean') {
                                item.history = false;
                            } else {
                                item.history.enabled = false;
                            }

                            item.set(args.path, value);

                            if (typeof(item.history) === 'boolean') {
                                item.history = true;
                            } else {
                                item.history.enabled = true;
                            }
                        }
                    }
                });
            }));
            events.push(editor.on('picker:color:close', function() {
                args.field._changing = false;
            }));
        }

        update();
        args.field.on('change', changeField);

        for(var i = 0; i < args.link.length; i++)
            events.push(args.link[i].on(args.path + ':set', changeFieldQueue));

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
            panel.append(label);
        }

        var field;

        var linkField = function() {
            if (args.link) {
                var link = function(field, path) {
                    if ((args.link instanceof Array && args.link.length > 1) || args.type === 'rgb') {
                        editor.call('attributes:linkField', {
                            field: field,
                            path: path || args.path,
                            type: args.type,
                            enum: args.enum,
                            link: args.link
                        });
                    } else {
                        field.link((args.link instanceof Array) ? args.link[0] : args.link, path || args.path);
                        if (args.enum && field.optionElements[''])
                            field.optionElements[''].style.display = 'none';
                    }
                }
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

            case 'number':
                if (args.enum) {
                    field = new ui.SelectField({
                        options: args.enum,
                        number: true
                    });
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
                field = new ui.Checkbox();
                field.value = args.value || 0;

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
                        // if (field._link && typeof(field._link.history) === 'object')
                        //     field._link.history.combine = ! first;

                        first = false;
                        field.value = color;

                        // if (field._link && typeof(field._link.history) === 'object')
                        //     field._link.history.combine = false;
                    });

                    // position picker
                    var rectPicker = editor.call('picker:color:rect');
                    var rectField = field.element.getBoundingClientRect();
                    editor.call('picker:color:position', rectField.left - rectPicker.width, rectField.top);

                    // color changed, update picker
                    var evtColorToPicker = field.on('change', function() {
                        // if (field._changing)
                        //     return;

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
                    text: '&#58214;'
                });
                btnEdit.disabled = true;
                btnEdit.parent = panel;
                btnEdit.flexGrow = 0;

                var btnRemove = new ui.Button({
                    text: '&#58422;'
                });
                btnRemove.disabled = true;
                btnRemove.parent = panel;
                btnRemove.flexGrow = 0;

                fieldTitle.on('click', function() {
                    var asset = editor.call('assets:get', this.value);
                    editor.call('picker:asset', args.kind, asset);

                    evtPick = editor.once('picker:asset', function(asset) {
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
                });
                btnEdit.on('click', function() {
                    field.emit('click');
                });

                btnRemove.on('click', function() {
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
                                field.image = config.url.home + asset.get('thumbnails.m');
                            }
                        } else {
                            field.image = '/editor/scene/img/asset-placeholder-' + asset.get('type') + '.png';
                        }
                    }
                };

                field.on('change', function(value) {
                    fieldTitle.text = this.class.contains('null') ? 'various' : 'Empty';

                    btnEdit.disabled = ! value;
                    btnRemove.disabled = ! value;

                    if (evtThumbnailChange) {
                        evtThumbnailChange.unbind();
                        evtThumbnailChange = null;
                    }

                    if (! value)
                        return field.empty = true;

                    field.empty = false;

                    var asset = editor.call('assets:get', value);

                    if (! asset)
                        return field.image = config.url.home + '/editor/scene/img/asset-placeholder-texture.png';

                    evtThumbnailChange = asset.on('thumbnails.m:set', updateThumbnail);
                    updateThumbnail();

                    fieldTitle.text = asset.get('file.filename') || asset.get('name');
                });

                if (args.value)
                    field.value = args.value;

                linkField();

                var dropRef = editor.call('drop:target', {
                    ref: panel.element,
                    filter: function(type, data) {
                        return type === 'asset.' + args.kind && data.id !== field.value;
                    },
                    drop: function(type, data) {
                        if (type !== 'asset.' + args.kind)
                            return;

                        field.value = data.id;
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

                if (args.value)
                    field.value = args.value;

                if (args.link)
                    field.link(args.link, args.paths || [args.path]);

                var curvePickerOn = false;

                var toggleCurvePicker = function () {
                    if (!field.class.contains('disabled') && !curvePickerOn) {
                        editor.call('picker:curve', field.value, args);

                        curvePickerOn = true;

                        var first = true;

                        // position picker
                        var rectPicker = editor.call('picker:curve:rect');
                        var rectField = field.element.getBoundingClientRect();
                        editor.call('picker:curve:position', rectField.right - rectPicker.width, rectField.bottom);

                        var evtPickerStartChange = editor.on('picker:curve:change:start', function () {
                            first = true;
                        });

                        var evtPickerChanged = editor.on('picker:curve:change', function (path, value) {
                            var combine;
                            if (field._link) {
                                combine = field._link.history.combine;
                                field._link.history.combine = !first;

                                if (args.paths) {
                                    path = args.paths[parseInt(path[0])] + path.substring(1);
                                } else {
                                    path = args.path + path.substring(1);
                                }

                                field._link.set(path, value);

                                field._link.history.combine = combine;

                                // set second graph keys to be the same as the first
                                // if betweenCurves if false
                                if (args.paths) {
                                    if (path.indexOf(args.paths[0]) === 0) {
                                        if ((path.indexOf('.keys') !== -1 || path.indexOf('betweenCurves') !== -1)) {
                                            if (! field._link.get(args.paths[0] + '.betweenCurves')) {
                                                var history = field._link.history.enabled;
                                                field._link.history.enabled = false;
                                                field._link.set(args.paths[1] + '.keys', field._link.get(args.paths[0] + '.keys'));
                                                field._link.history.enabled = history;
                                            }
                                        }
                                    }
                                }

                            }

                            first = false;
                        });

                        var evtRefreshPicker = field.on('change', function (value) {
                            editor.call('picker:curve:set', value, args);
                        });

                        editor.once('picker:curve:close', function () {
                            evtRefreshPicker.unbind();
                            evtPickerStartChange.unbind();
                            evtPickerChanged.unbind();
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

                if (args.link)
                    field.link(args.link, args.path);

                panel.append(field);
                break;
        }

        return field;
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

        root.header = title + ' (' + type + ')';
        editor.emit('attributes:inspect[' + type + ']', [ item ]);
        editor.emit('attributes:inspect[*]', type, [ item ]);
    });

    editor.on('selector:change', function(items) {
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

        var type = editor.call('selector:type');
        root.header = title + ' (' + type + ')';
        editor.emit('attributes:inspect[' + type + ']', items);
        editor.emit('attributes:inspect[*]', type, items);
    });

    editor.emit('selector:change', [ ]);
});
