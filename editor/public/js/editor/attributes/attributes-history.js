editor.once('load', function() {
    'use strict';

    var list = [ ];
    var selecting = false;


    var root = editor.call('layout.root');
    var panel = editor.call('layout.right');


    var controls = new ui.Panel();
    controls.class.add('inspector-controls');
    controls.parent = panel;
    panel.headerAppend(controls);


    var selectorReturn = function() {
        var item = getLast();
        if (! item)
            return;

        // remove last one
        list = list.slice(0, list.length - 1);

        selecting = true;
        editor.call('selector:set', item.type, item.items);
        editor.once('selector:change', function() {
            selecting = false;

            updateTooltipContent();
        });
    };
    editor.method('selector:return', selectorReturn);


    var btnBack = new ui.Button({
        text: '&#57649;'
    });
    btnBack.disabledClick = true;
    btnBack.hidden = true;
    btnBack.class.add('back');
    btnBack.on('click', selectorReturn);
    controls.append(btnBack);


    editor.on('selector:change', function(type, items) {
        if (selecting)
            return;

        updateTooltipContent();

        if (! type || ! items)
            return;

        var last = getLast();

        if (last && last.items.length === 1 && items.length === 1 && last.items[0] === items[0])
            return;

        list.push({
            type: type,
            items: items
        });
    });

    var getLast = function() {
        if (! list.length)
            return;

        var ignoreType = editor.call('selector:type');
        var ignore = editor.call('selector:items');

        var i = list.length - 1;
        var candidate = list[i];

        while(candidate && ignoreType && ignoreType === candidate.type && candidate.items.equals(ignore))
            candidate = list[--i];

        return candidate || null;
    };

    var updateTooltipContent = function() {
        var item = getLast();

        if (! item && ! btnBack.hidden) {
            btnBack.hidden = true;
        } else if (item && btnBack.hidden) {
            btnBack.hidden = false;
        }

        if (item && ! tooltip.hidden) {
            if (item.type === 'entity') {
                if (item.items.length === 1) {
                    setTooltipText(item.items[0].get('name') + ' [entity]');
                } else {
                    setTooltipText('[' + item.items.length + ' entities]');
                }
            } else if (item.type === 'asset') {
                if (item.items.length === 1) {
                    setTooltipText(item.items[0].get('name') + ' [' + item.items[0].get('type') + ']');
                } else {
                    setTooltipText('[' + item.items.length + ' assets]');
                }
            } else if (item.type === 'designerSettings') {
                setTooltipText('Settings');
            }
        }
    };


    var tooltip = Tooltip.attach({
        target: btnBack.element,
        text: '-',
        align: 'top',
        root: root
    });
    tooltip.on('show', updateTooltipContent);
    tooltip.class.add('previous-selection');

    btnBack.on('hide', function() {
        tooltip.hidden = true;
    });

    var setTooltipText = function(str) {
        tooltip.html = '<span>Previous Selection</span><br />' + str;
    };


    editor.call('hotkey:register', 'selector:return', {
        key: 'z',
        shift: true,
        callback: selectorReturn
    });
});



