import { LegacyOverlay } from '@/common/ui/overlay';

editor.once('load', () => {
    const overlay = new LegacyOverlay();
    overlay.class.add('picker-entity');
    overlay.center = false;
    overlay.hidden = true;

    const root = editor.call('layout.root');
    root.append(overlay);

    // initial select state
    let currentEntity = null;
    let initialSelection = null;

    // elements
    const hierarchy = editor.call('entities:hierarchy');
    const hierarchyPanel = hierarchy.parent;
    let hierarchyCollapsed = false;

    // esc to close
    editor.call('hotkey:register', 'picker:entity:close', {
        key: 'Escape',
        callback: function () {
            if (overlay.hidden) {
                return;
            }

            overlay.hidden = true;
        }
    });

    // picked entity
    hierarchy.on('select', (item) => {
        if (overlay.hidden || item.entity === currentEntity) {
            return;
        }

        // emit event
        if (item.entity) {
            editor.emit('picker:entity', item.entity);
        }

        // hide picker
        overlay.hidden = true;
    });


    // on close entity picker
    overlay.on('hide', () => {
        // fold back hierarchy panel if needed
        if (hierarchyCollapsed) {
            hierarchyPanel.collapsed = true;
        }

        // disable new selections
        for (let i = 0, len = hierarchy.selected.length; i < len; i++) {
            hierarchy.selected[i].selected = false;
        }

        for (let i = 0, len = initialSelection.length; i < len; i++) {
            initialSelection[i].selected = true;
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
    editor.method('picker:entity', (resourceId, fn) => {
        // disable selector
        editor.call('selector:enabled', false);

        // get current hierarchy selection
        initialSelection = hierarchy.selected ? hierarchy.selected.slice(0) : [];
        if (initialSelection) {
            for (let i = 0, len = initialSelection.length; i < len; i++) {
                initialSelection[i].selected = false;
            }
        }

        // find current entity
        if (resourceId) {
            currentEntity = editor.call('entities:get', resourceId);
        }

        if (currentEntity) {
            const item = editor.call('entities:panel:get', resourceId);
            // select in hierarchy
            if (item) {
                item.selected = true;
            }
        } else {
            hierarchy.deselect();
        }

        // show hierarchy panel in front
        hierarchyPanel.style.zIndex = 102;
        hierarchyPanel.style.overflow = 'visible';
        // if panel collapsed
        hierarchyCollapsed = hierarchyPanel.collapsed;
        if (hierarchyCollapsed) {
            hierarchyPanel.collapsed = false;
        }

        // show overlay
        overlay.hidden = false;
        // flash entities panel
        hierarchyPanel.flash();
        // focus on panel
        setTimeout(() => {
            const selected = hierarchy.selected;
            if (selected.length) {
                selected[0].focus();
            } else {
                hierarchy.element.focus();
            }
        }, 100);
    });


    // close entity picker
    editor.method('picker:entity:close', () => {
        // hide overlay
        overlay.hidden = true;
    });
});
