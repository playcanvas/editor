editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.right');

    var clearPanel = function() {
        root.clear();
    };

    // clearing
    editor.hook('attributes:clear', clearPanel);

    // get current inspected items
    editor.hook('attributes:items', function() {
        var type = editor.call('selector:type');
        var items = editor.call('selector:items');
        return {
            type: type,
            items: items
        };
    });

    // set header
    editor.hook('attributes:header', function(title) {
        root.header = 'Attributes (' + title + ')';
    });

    // return root panel
    editor.hook('attributes.rootPanel', function() {
        return root;
    });

    // add panel
    editor.hook('attributes:addPanel', function(args) {
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
    editor.hook('attributes:addField', function(args) {
        var panel = new ui.Panel();
        panel.flexWrap = 'nowrap';
        panel.style.display = '';

        if (args.type)
            panel.class.add('field-' + args.type);

        (args.parent || root).append(panel);

        if (args.name) {
            var label = new ui.Label(args.name);
            label.flexShrink = 0;
            label.style.width = '78px';
            label.style.textAlign = 'right';
            label.style.fontSize = '12px';
            label.style.overflow = 'hidden';
            label.style.textOverflow = 'ellipsis';
            label.style.whiteSpace = 'nowrap';
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

                if (args.link)
                    field.link(args.link, args.path);

                panel.append(field);

                return field;
            case 'number':
                var field = new ui.NumberField();
                field.value = args.value || 0;
                field.flexGrow = 1;

                if (args.link)
                    field.link(args.link, args.path);

                panel.append(field);

                return field;
            case 'checkbox':
                var field = new ui.Checkbox();
                field.value = args.value || 0;
                // field.flexGrow = 1;

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

                if (args.link) {
                    field0.link(args.link, args.path + '.0');
                    field1.link(args.link, args.path + '.1');
                    field2.link(args.link, args.path + '.2');
                    field3.link(args.link, args.path + '.3');
                }

                return [ field0, field1, field2, field3 ];
            case 'rgb':
                var field = new ui.TextField();
                field.style.borderRight = 'none';
                field.value = args.value || 'ffffff';
                field.flexGrow = 4;

                if (args.link) {
                    var updateField = function() {
                        var value = args.link.get(args.path);
                        field.value = ((1 << 24) + (Math.floor(value[0] * 255) << 16) + (Math.floor(value[1] * 255) << 8) + Math.floor(value[2] * 255)).toString(16).slice(1);
                    };

                    args.link.on(args.path + '.0:set', updateField);
                    args.link.on(args.path + '.1:set', updateField);
                    args.link.on(args.path + '.2:set', updateField);

                    field.once('destroy', function() {
                        args.link.unbind(args.path + '.0:set', updateField);
                        args.link.unbind(args.path + '.1:set', updateField);
                        args.link.unbind(args.path + '.2:set', updateField);
                    });

                    updateField();

                    field.on('change', function(value) {
                        if (! /^[0-9A-F]{6}$/i.test(value)) {
                            setTimeout(updateField, 0);
                            return;
                        }

                        var bigint = parseInt(value, 16);
                        var r = ((bigint >> 16) & 255) / 255;
                        var g = ((bigint >> 8) & 255) / 255;
                        var b = (bigint & 255) / 255;

                        args.link.set(args.path, [ r, g, b ]);
                    });
                }

                panel.append(field);

                var button = new ui.Button();
                button.flexGrow = 1;
                button.style.width = '32px';
                button.style.border = 'none';
                button.style.marginLeft = '-4px';
                button.style.padding = '0px';
                button.style.backgroundColor = '#' + field.value;
                field.on('change', function(value) {
                    button.style.backgroundColor = '#' + value;
                });
                panel.append(button);

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
            default:
                var field = new ui.Label();
                field.flexGrow = 1;
                field.style.padding = '0 8px'
                field.style.backgroundColor = '#000';
                field.style.fontSize = '11px';
                field.style.fontFamily = '"Lucida Grande"';
                field.style.border = '1px solid #000';
                field.text = args.value || '';

                if (args.link)
                    field.link(args.link, args.path);

                panel.append(field);

                return field;
        }
    });

    editor.hook('attributes:inspect', function(type, item) {
        clearPanel();
        root.header = 'Attributes (' + type + ')';
        editor.emit('attributes:inspect[' + type + ']', item);
    });

    editor.on('selector:change', function(items) {
        clearPanel();

        // nothing selected
        if (items.length === 0) {
            var label = new ui.Label('Select anything to Inspect');
            label.style.display = 'block';
            label.style.textAlign = 'center';
            root.append(label);

            root.header = 'Attributes';

            return;
        }

        var type = editor.call('selector:type');
        root.header = 'Attributes (' + type + ')';
        editor.emit('attributes:inspect[' + type + ']', items);
    });
});
