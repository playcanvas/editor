editor.once('load', function () {
    'use strict';

    editor.method('templates:computeFilteredOverrides', function (root) {
        const overrides = editor.call('templates:computeOverrides', root);

        filterChildrenConflicts(overrides);

        setAllReparentPaths(overrides);

        keepOnePerSubtree(overrides, 'addedEntities');

        keepOnePerSubtree(overrides, 'deletedEntities');

        setNumOverrides(overrides);

        return overrides;

    });

    function filterChildrenConflicts(overrides) {
        const a = overrides.conflicts.map(h => {
            return h.path === 'children' ?
                editor.call('templates:handleChildrenConflict', h, overrides) :
                h;
        });

        overrides.conflicts = editor.call('template:utils', 'rmFalsey', a);
    }

    function setAllReparentPaths(overrides) {
        overrides.conflicts.forEach(h => {
            if (h.path === 'parent') {
                editor.call('templates:setReparentPath', h, overrides);
            }
        });
    }

    function keepOnePerSubtree(overrides, type) {
        const a = overrides[type];

        const h = editor.call('template:utils', 'entArrayToMap', a);

        overrides[type] = a.filter(ent => !h[ent.parent]);
    }

    function setNumOverrides(overrides) {
        overrides.totalOverrides = 0;

        [ 'conflicts', 'addedEntities', 'deletedEntities' ].forEach(k => {
            overrides.totalOverrides += overrides[k].length;
        })
    }
});
