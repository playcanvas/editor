editor.once('load', function() {
    'use strict';

    var overlay = new ui.Overlay();
    overlay.class.add('picker-entity');
    overlay.center = false;
    overlay.hidden = true;

    var root = editor.call('layout.root');
    root.append(overlay);

    // initial select state
    var currentEntity = null;
    var initialSelection = null;

    // elements
    var hierarchy = editor.call('entities:hierarchy');
    var hierarchyPanel = hierarchy.parent;
    var hierarchyCollapsed = false;

    const usePcuiEntities = editor.call('users:hasFlag', 'hasPcuiEntities');

    // esc to close
    editor.call('hotkey:register', 'picker:entity:close', {
        key: 'esc',
        callback: function() {
            if (overlay.hidden)
                return;

            overlay.hidden = true;
        }
    });

    hierarchy.on('deselect', function (item) {
        if (overlay.hidden || !item.entity || item.entity !== currentEntity)
            return;
    });

    // picked entity
    hierarchy.on('select', function (item) {
        if (overlay.hidden || item.entity === currentEntity)
            return;

        // emit event
        if (item.entity)
            editor.emit('picker:entity', item.entity);

        // hide picker
        overlay.hidden = true;
    });


    // on close entity picker
    overlay.on('hide', function() {
        // fold back hierarchy panel if needed
        if (hierarchyCollapsed)
            hierarchyPanel.collapsed = true;

        // disable new selections
        for (var i = 0, len = hierarchy.selected.length; i < len; i++)
            hierarchy.selected[i].selected = false;

        // select what was selected
        if (!usePcuiEntities) {
            hierarchy.selected = initialSelection;
        }

        for (var i = 0, len = initialSelection.length; i < len; i++)
            initialSelection[i].selected = true;

        if (!usePcuiEntities) {
            if (initialSelection.length) {
                initialSelection[initialSelection.length - 1].elementTitle.focus();
            }
        }

        currentEntity = null;

        // enable selector
        editor.call('selector:enabled', true);

        // emit event
        editor.emit('picker:entity:close');
        // styling
        hierarchyPanel.style.zIndex = '';
        hierarchyPanel.style.overflow = '';
    });


    // open entity picker
    editor.method('picker:entity', function(resourceId, fn) {
        // disable selector
        editor.call('selector:enabled', false);

        // get current hierarchy selection
        initialSelection = hierarchy.selected ? hierarchy.selected.slice(0) : [];
        if (initialSelection) {
            for (var i = 0, len = initialSelection.length; i < len; i++) {
                initialSelection[i].selected = false;
            }
        }

        // find current entity
        if (resourceId)
            currentEntity = editor.call('entities:get', resourceId);

        if (currentEntity) {
            var item = editor.call('entities:panel:get', resourceId);
            // select in hierarchy
            if (item) {
                if (!usePcuiEntities) {
                    hierarchy.selected = [ item ];
                }
                item.selected = true;
            }
        } else {
            if (usePcuiEntities) {
                hierarchy.deselect();
            } else {
                hierarchy.selected = [ ];
            }
        }

        // show hierarchy panel in front
        hierarchyPanel.style.zIndex = 102;
        hierarchyPanel.style.overflow = 'visible';
        // if panel collapsed
        hierarchyCollapsed = hierarchyPanel.collapsed;
        if (hierarchyCollapsed)
            hierarchyPanel.collapsed = false;

        // show overlay
        overlay.hidden = false;
        // flash entities panel
        hierarchyPanel.flash();
        // focus on panel
        setTimeout(function() {
            const selected = hierarchy.selected;
            if (selected.length) {
                if (usePcuiEntities) {
                    selected[0].focus();
                } else {
                    selected[0].elementTitle.focus();
                }
            } else {
                hierarchy.element.focus();
            }
        }, 100);
    });


    // close entity picker
    editor.method('picker:entity:close', function() {
        // hide overlay
        overlay.hidden = true;
    });
});
