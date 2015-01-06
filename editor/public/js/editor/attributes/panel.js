(function() {
    'use strict';

    var root = attributesPanel;

    var clearPanel = function() {
        root.clear();
    };

    // clearing
    msg.hook('attributes:clear', clearPanel);

    // get current inspected items
    msg.hook('attributes:items', function() {
        var type = msg.call('selector:type');
        var items = msg.call('selector:items');
        return {
            type: type,
            items: items
        };
    });

    // set header
    msg.hook('attributes:header', function(title) {
        root.header = 'Attributes (' + title + ')';
    });

    // add panel
    msg.hook('attributes:addPanel', function(args) {
        args = args || { };
        var panel = new ui.Panel(args.name || '');
        (args.parent || root).append(panel);
        return panel;
    });

    // add field
    msg.hook('attributes:addField', function(args) {
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

    msg.hook('attributes:inspect', function(type, item) {
        clearPanel();
        root.header = 'Attributes (' + type + ')';
        msg.emit('attributes:inspect[' + type + ']', item);
    });

    msg.on('selector:change', function(items) {
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

        var type = msg.call('selector:type');
        root.header = 'Attributes (' + type + ')';
        msg.emit('attributes:inspect[' + type + ']', items);
    });
})();
