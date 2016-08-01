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
    var hierarchyFolded = false;
    var filter = null;

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
        if (overlay.hidden || item.entity === currentEntity || (filter && ! filter(item.entity)))
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
        if (hierarchyFolded)
            hierarchyPanel.folded = true;

        // disable new selections
        for (var i = 0, len = hierarchy.selected.length; i < len; i++)
            hierarchy.selected[i].selected = false;

        // select what was selected
        hierarchy.selected = initialSelection;
        for (var i = 0, len = initialSelection.length; i < len; i++)
            initialSelection[i].selected = true;

        if (initialSelection.length)
            initialSelection[initialSelection.length - 1].elementTitle.focus();

        currentEntity = null;

        var entities = editor.call('entities:list');
        for(var i = 0; i < entities.length; i++) {
            var id = entities[i].get('resource_id');
            var item = editor.call('entities:panel:get', id);
            if (! item) continue;
            item.elementTitle.classList.remove('disabled');
        }

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
                hierarchy.selected = [ item ];
                item.selected = true;
            }
        } else {
            hierarchy.selected = [ ];
        }

        filter = fn || null;
        var entities = editor.call('entities:list');
        for(var i = 0; i < entities.length; i++) {
            var id = entities[i].get('resource_id');
            var item = editor.call('entities:panel:get', id);
            if (! item) continue;

            if (filter) {
                if (! filter(entities[i]))
                    item.elementTitle.classList.add('disabled');
            }
        }

        // show hierarchy panel in front
        hierarchyPanel.style.zIndex = 102;
        hierarchyPanel.style.overflow = 'visible';
        // if panel folded?
        hierarchyFolded = hierarchyPanel.folded;
        if (hierarchyFolded)
            hierarchyPanel.folded = false;

        // show overlay
        overlay.hidden = false;
        // flash entities panel
        hierarchyPanel.flash();
        // focus on panel
        setTimeout(function() {
            if (hierarchy.selected.length) {
                hierarchy.selected[0].elementTitle.focus();
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
