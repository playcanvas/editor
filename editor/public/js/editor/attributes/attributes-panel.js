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

    // add field
    editor.method('attributes:addField', function(args) {
        var panel = new ui.Panel();
        panel.flexWrap = 'nowrap';
        panel.WebkitFlexWrap = 'nowrap';
        panel.style.display = '';

        if (args.type) {
            panel.class.add('field-' + args.type);
        } else {
            panel.class.add('field');
        }

        (args.parent || root).append(panel);

        if (args.name) {
            var label = new ui.Label({
                text: args.name
            });
            label.class.add('label-field');
            panel.append(label);
        }

        if (args.enum) {
            var field = new ui.SelectField({
                options: args.enum,
                number: args.type === 'number'
            });
            field.value == args.value || '';
            field.flexGrow = 1;
            panel.append(field);

            if (args.link)
                field.link(args.link, args.path);

            return field;
        }

        switch(args.type) {
            case 'string':
                var field = new ui.TextField();
                field.value = args.value || '';
                field.flexGrow = 1;
                if (args.placeholder)
                    field.placeholder = args.placeholder;

                if (args.link)
                    field.link(args.link, args.path);

                panel.append(field);

                return field;
            case 'number':
                var field = new ui.NumberField();
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

                if (args.link)
                    field.link(args.link, args.path);

                panel.append(field);

                return field;
            case 'checkbox':
                var field = new ui.Checkbox();
                field.value = args.value || 0;

                if (args.link)
                    field.link(args.link, args.path);

                panel.append(field);

                return field;
            case 'vec2':
            case 'vec3':
            case 'vec4':
                var channels = parseInt(args.type[3], 10);
                var fields = [ ];

                for(var i = 0; i < channels; i++) {
                    fields[i] = new ui.NumberField();
                    fields[i].flexGrow = 1;
                    fields[i].style.width = '24px';
                    fields[i].value = (args.value && args.value[i]) || 0;
                    panel.append(fields[i]);

                    if (args.placeholder)
                        fields[i].placeholder = args.placeholder[i];

                    if (args.precision != null)
                        fields[i].precision = args.precision;

                    if (args.step != null)
                        fields[i].step = args.step;

                    if (args.min != null)
                        fields[i].min = args.min;

                    if (args.max != null)
                        fields[i].max = args.max;

                    if (args.link)
                        fields[i].link(args.link, args.path + '.' + i);
                }

                return fields;
            case 'rgb':
                var field = new ui.ColorField();

                if (args.link) {
                    field.link(args.link, args.path);
                }

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
                        if (field._link && typeof(field._link.history) === 'object')
                            field._link.history.combine = ! first;

                        first = false;
                        field.value = color;

                        if (field._link && typeof(field._link.history) === 'object')
                            field._link.history.combine = false;
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

                return field;
            case 'asset':
                var field = new ui.ImageField();
                var evtPick;

                field.on('click', function() {
                    var asset = editor.call('assets:get', this.value);
                    editor.call('picker:asset', args.kind, asset);

                    evtPick = editor.once('picker:asset', function(asset) {
                        args.link.set(args.path, asset.get('id'))
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

                field.on('view', function() {
                    var asset = editor.call('assets:get', this.value);
                    if (! asset) return;
                    editor.call('selector:set', 'asset', [ asset ]);
                });

                field.on('change', function(value) {
                    if (! value)
                        return field.empty = true;

                    field.empty = false;

                    var asset = editor.call('assets:get', value);

                    if (! asset)
                        return field.image = '';

                    if (asset.has('thumbnails.m')) {
                        field.image = config.url.home + asset.get('thumbnails.m');
                    } else {
                        field.image = '';
                    }
                });

                if (args.value)
                    field.value = args.value;

                if (args.link)
                    field.link(args.link, args.path)

                var dropRef = editor.call('drop:target', {
                    ref: field.element,
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
                });

                panel.append(field)

                return field;
            case 'image':
                panel.flex = false;

                var image = new Image();
                image.style.maxWidth = '100%';
                image.style.display = 'block';
                image.src = args.src;

                panel.append(image);

                return image;
            case 'progress':
                var field = new ui.Progress();
                field.flexGrow = 1;

                panel.append(field);
                return field;
            case 'code':
                var field = new ui.Code();
                field.flexGrow = 1;

                if (args.value)
                    field.text = args.value;

                panel.append(field);

                return field;
            case 'button':
                var field = new ui.Button();
                field.flexGrow = 1;
                field.text = args.text || 'Button';
                panel.append(field);
                return field;
            case 'element':
                panel.append(args.element);
                return args.element;
            case 'curveset':
                var field = new ui.CurveField(args);
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

                        var onPickerStartChange = function () {
                            first = true;
                        };

                        editor.on('picker:curve:change:start', onPickerStartChange);

                        var onPickerChanged = function (path, value) {
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
                            }

                            first = false;
                        };

                        editor.on('picker:curve:change', onPickerChanged);

                        var refreshPicker = function (value) {
                            editor.call('picker:curve:set', value, args);
                        };

                        field.on('change', refreshPicker);


                        editor.once('picker:curve:close', function () {
                            field.unbind('change', refreshPicker);
                            editor.unbind('picker:curve:change:start', onPickerStartChange);
                            editor.unbind('picker:curve:change', onPickerChanged);
                            curvePickerOn = false;
                        });
                    }
                };

                // open curve editor on click
                field.on('click', toggleCurvePicker);

                // open curve editor on space
                field.element.addEventListener('keydown', function (e) {
                    if (e.which === 32) {
                        e.stopPropagation();
                        e.preventDefault();
                        if (!curvePickerOn) {
                            toggleCurvePicker();
                        } else {
                            editor.call('picker:curve:close');
                        }
                    }
                });

                // close picker if field destroyed
                field.on('destroy', function() {
                    if (curvePickerOn) {
                        editor.call('picker:curve:close');
                    }
                });

                panel.append(field);
                return field;
            default:
                var field = new ui.Label();
                field.flexGrow = 1;
                field.text = args.value || '';
                if (args.placeholder)
                    field.placeholder = args.placeholder;

                if (args.link)
                    field.link(args.link, args.path);

                panel.append(field);

                return field;
        }
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
