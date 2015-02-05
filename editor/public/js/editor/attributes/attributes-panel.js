editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.right');

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
    editor.method('attributes:header', function(title) {
        root.header = 'Attributes (' + title + ')';
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
                var field0 = new ui.NumberField();
                field0.flexGrow = 1;
                field0.style.width = '24px';
                field0.value = (args.value && args.value[0]) || 0;
                panel.append(field0);

                var field1 = new ui.NumberField();
                field1.flexGrow = 1;
                field1.style.width = '24px';
                field1.value = (args.value && args.value[1]) || 0;
                panel.append(field1);

                if (args.link) {
                    field0.link(args.link, args.path + '.0');
                    field1.link(args.link, args.path + '.1');
                }

                return [ field0, field1 ];
            case 'vec3':
                var field0 = new ui.NumberField();
                field0.flexGrow = 1;
                field0.style.width = '24px';
                field0.value = (args.value && args.value[0]) || 0;
                panel.append(field0);

                var field1 = new ui.NumberField();
                field1.flexGrow = 1;
                field1.style.width = '24px';
                field1.value = (args.value && args.value[1]) || 0;
                panel.append(field1);

                var field2 = new ui.NumberField();
                field2.flexGrow = 1;
                field2.style.width = '24px';
                field2.value = (args.value && args.value[2]) || 0;
                panel.append(field2);

                if (args.placeholder) {
                    field0.placeholder = args.placeholder[0];
                    field1.placeholder = args.placeholder[1];
                    field2.placeholder = args.placeholder[2];
                }

                if (args.link) {
                    field0.link(args.link, args.path + '.0');
                    field1.link(args.link, args.path + '.1');
                    field2.link(args.link, args.path + '.2');
                }

                return [ field0, field1, field2 ];
            case 'vec4':
                var field0 = new ui.NumberField();
                field0.flexGrow = 1;
                field0.style.width = '24px';
                field0.value = (args.value && args.value[0]) || 0;
                panel.append(field0);

                var field1 = new ui.NumberField();
                field1.flexGrow = 1;
                field1.style.width = '24px';
                field1.value = (args.value && args.value[1]) || 0;
                panel.append(field1);

                var field2 = new ui.NumberField();
                field2.flexGrow = 1;
                field2.style.width = '24px';
                field2.value = (args.value && args.value[2]) || 0;
                panel.append(field2);

                var field3 = new ui.NumberField();
                field3.flexGrow = 1;
                field3.style.width = '24px';
                field3.value = (args.value && args.value[3]) || 0;
                panel.append(field3);

                if (args.placeholder) {
                    field0.placeholder = args.placeholder[0];
                    field1.placeholder = args.placeholder[1];
                    field2.placeholder = args.placeholder[2];
                    field3.placeholder = args.placeholder[3];
                }

                if (args.link) {
                    field0.link(args.link, args.path + '.0');
                    field1.link(args.link, args.path + '.1');
                    field2.link(args.link, args.path + '.2');
                    field3.link(args.link, args.path + '.3');
                }

                return [ field0, field1, field2, field3 ];
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
                        if (field._link && field._link.history)
                            field._link.history.combine = ! first;

                        first = false;
                        field.value = color;

                        if (field._link && field._link.history)
                            field._link.history.combine = false;
                    });

                    // position picker
                    var rectPicker = editor.call('picker:color:rect');
                    var rectField = field.element.getBoundingClientRect();
                    editor.call('picker:color:position', rectField.right - rectPicker.width, rectField.bottom);

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
                    });
                });

                // close picker if field destroyed
                field.on('destroy', function() {
                    if (colorPickerOn)
                        editor.call('picker:color:close');
                });

                panel.append(field);

                return field;
            case 'texture':
                var field = new ui.ImageField();

                field.on('change', function(value) {
                    if (! value)
                        return field.image = '';

                    var asset = editor.call('assets:get', value);

                    if (! asset)
                        return field.image = '';

                    if (asset.thumbnails) {
                        field.image = config.url.home + asset.thumbnails.m;
                    } else {
                        field.image = '';
                    }
                });

                if (args.value)
                    field.value = args.value;

                if (args.link)
                    field.link(args.link, args.path)

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
        inspectedItems.push(item.onnce('destroy', function() {
            editor.call('attributes:clear');
        }));

        root.header = 'Attributes (' + type + ')';
        editor.emit('attributes:inspect[' + type + ']', item);
    });

    editor.on('selector:change', function(items) {
        clearPanel();

        // nothing selected
        if (items.length === 0) {
            var label = new ui.Label({ text: 'Select anything to Inspect' });
            label.style.display = 'block';
            label.style.textAlign = 'center';
            root.append(label);

            root.header = 'Attributes';

            return;
        }

        // clear if destroyed
        for(var i = 0; i < items.length; i++) {
            inspectedItems.push(items[i].once('destroy', function() {
                editor.call('attributes:clear');
            }));
        }

        var type = editor.call('selector:type');
        root.header = 'Attributes (' + type + ')';
        editor.emit('attributes:inspect[' + type + ']', items);
    });
});
